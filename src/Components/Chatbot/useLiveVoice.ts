import { useRef, useCallback } from "react";

const GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

export type LiveState = "idle" | "connecting" | "listening" | "speaking";

interface UseLiveVoiceOptions {
  systemPrompt: string;
  onStateChange?: (state: LiveState) => void;
  onError?: (error: string) => void;
}

export function useLiveVoice({
  systemPrompt,
  onStateChange,
  onError,
}: UseLiveVoiceOptions) {
  const wsRef = useRef<WebSocket | null>(null);

  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionActiveRef = useRef(false);

  // FIX: use scheduled playback time instead of queuing separate BufferSources
  const nextPlayTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState = useCallback(
    (state: LiveState) => onStateChange?.(state),
    [onStateChange]
  );

  // ── Smooth scheduled audio playback ─────────────────────────────────────────
  // Instead of queuing separate BufferSources (causes gaps), we schedule each
  // chunk to play exactly when the previous one ends using AudioContext.currentTime.

  const scheduleAudioChunk = useCallback(
    async (audioData: ArrayBuffer) => {
      try {
        if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
          playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
          nextPlayTimeRef.current = 0;
        }
        const ctx = playbackCtxRef.current;
        if (ctx.state === "suspended") await ctx.resume();

        const pcm16 = new Int16Array(audioData);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        // Schedule immediately if we're behind current time, otherwise chain
        const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
        source.start(startAt);
        nextPlayTimeRef.current = startAt + buffer.duration;

        // Mark as speaking
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setState("speaking");
        }

        // Reset speaking state shortly after the last chunk finishes
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          isSpeakingRef.current = false;
          if (sessionActiveRef.current) setState("listening");
        }, (nextPlayTimeRef.current - (playbackCtxRef.current?.currentTime ?? 0)) * 1000 + 300);

      } catch (e) {
        console.warn("[Live] Playback error:", e);
      }
    },
    [setState]
  );

  // ── PCM16 → base64 ────────────────────────────────────────────────────────

  function pcm16ToBase64(pcm16: Int16Array): string {
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK)
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    return btoa(binary);
  }

  // ── Open session ───────────────────────────────────────────────────────────

  const openLiveVoice = useCallback(
    async (_unused: string) => {
      if (sessionActiveRef.current) return;
      setState("connecting");

      try {
        const tokenRes = await fetch("/api/live-token");
        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          console.error("[Live] Token fetch failed:", tokenRes.status, err);
          throw new Error("Token fetch failed");
        }
        const tokenData = await tokenRes.json();
        const token: string = tokenData.token;
        console.log("[Live] Got token, opening WebSocket...");

        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const connectTimeout = setTimeout(() => {
          console.error("[Live] Connection timed out. readyState:", ws.readyState);
          ws.close();
          onError?.("Bağlantı zaman aşımına uğradı. Yenidən cəhd edin.");
          setState("idle");
        }, 10000);

        ws.onopen = () => {
          clearTimeout(connectTimeout);
          console.log("[Live] WebSocket opened. Sending setup...");
          sessionActiveRef.current = true;

          ws.send(JSON.stringify({
            setup: {
              model: `models/${GEMINI_MODEL}`,
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Aoede" },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              // FIX: faster VAD = model responds sooner after user stops speaking
              realtimeInputConfig: {
                automaticActivityDetection: {
                  disabled: false,
                  startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
                  endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
                },
              },
            },
          }));


          setState("listening");
        };

        ws.onmessage = async (event) => {
          try {
            const text = event.data instanceof Blob
              ? await event.data.text()
              : (event.data as string);

            const msg = JSON.parse(text);

            if (!msg?.serverContent?.modelTurn) {
              console.log("[Live] Server msg:", JSON.stringify(msg).slice(0, 200));
            }

            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                const md = part.inlineData;
                if (md?.mimeType?.startsWith("audio/pcm")) {
                  const raw = atob(md.data);
                  const bytes = new Uint8Array(raw.length);
                  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                  // FIX: schedule chunk immediately for seamless playback
                  scheduleAudioChunk(bytes.buffer);
                }
              }
            }

            if (msg?.serverContent?.interrupted) {
              console.log("[Live] Interrupted, stopping playback");
              // FIX: reset scheduled time so next audio starts immediately
              if (playbackCtxRef.current) {
                nextPlayTimeRef.current = playbackCtxRef.current.currentTime;
              }
              isSpeakingRef.current = false;
              if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
              if (sessionActiveRef.current) setState("listening");
            }

            if (msg?.serverContent?.turnComplete) {
              console.log("[Live] Turn complete");
              // Speaking state is handled by the timeout in scheduleAudioChunk
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onerror = (e) => {
          clearTimeout(connectTimeout);
          console.error("[Live] WebSocket error:", e);
          onError?.("Canlı səs bağlantısında xəta baş verdi.");
          setState("idle");
        };

        ws.onclose = (e) => {
          clearTimeout(connectTimeout);
          console.warn("[Live] WebSocket closed. code:", e.code, "reason:", e.reason);
          sessionActiveRef.current = false;
          setState("idle");
        };

        // ── Microphone capture ─────────────────────────────────────────────
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const captureCtx = new AudioContext({ sampleRate: 16000 });
        captureCtxRef.current = captureCtx;

        const micSource = captureCtx.createMediaStreamSource(stream);
        sourceRef.current = micSource;

        // FIX: smaller buffer (2048) = lower latency mic capture
        const processor = captureCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!sessionActiveRef.current || ws.readyState !== WebSocket.OPEN) return;
          // FIX: allow sending while speaking so model can detect barge-in
          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
          }
          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: pcm16ToBase64(pcm16) }],
            },
          }));
        };

        micSource.connect(processor);
        const silentGain = captureCtx.createGain();
        silentGain.gain.value = 0;
        processor.connect(silentGain);
        silentGain.connect(captureCtx.destination);

      } catch (err) {
        console.error("[Live] Setup error:", err);
        onError?.("Mikrofona çıxış alınmadı və ya bağlantı xətası.");
        setState("idle");
        sessionActiveRef.current = false;
      }
    },
    [systemPrompt, setState, onError, scheduleAudioChunk]
  );

  // ── Close session ─────────────────────────────────────────────────────────

  const closeLiveVoice = useCallback(() => {
    sessionActiveRef.current = false;
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    captureCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current?.close().catch(() => {});
    wsRef.current?.close();
    nextPlayTimeRef.current = 0;
    isSpeakingRef.current = false;
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    captureCtxRef.current = null;
    playbackCtxRef.current = null;
    wsRef.current = null;
    setState("idle");
  }, [setState]);

  return { openLiveVoice, closeLiveVoice };
}
