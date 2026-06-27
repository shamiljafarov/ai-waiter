import { useRef, useCallback } from "react";

// Gemini Live API model
const GEMINI_MODEL = "gemini-2.0-flash-live-001";

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

  // Separate AudioContexts for playback (24kHz) and capture (16kHz)
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);

  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const setState = useCallback(
    (state: LiveState) => {
      onStateChange?.(state);
    },
    [onStateChange]
  );

  // ── Playback ────────────────────────────────────────────────────────────────

  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setState("speaking");

    const audioData = audioQueueRef.current.shift()!;

    try {
      // Use dedicated 24kHz context for playback
      if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = playbackCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      // Gemini sends raw PCM16 LE at 24kHz — we need to decode manually
      const pcm16 = new Int16Array(audioData);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        } else if (sessionActiveRef.current) {
          setState("listening");
        }
      };
      source.start();
    } catch (e) {
      console.warn("Playback error:", e);
      isPlayingRef.current = false;
      if (audioQueueRef.current.length > 0) {
        playNextAudio();
      }
    }
  }, [setState]);

  // ── PCM16 base64 encode (safe, no spread on large arrays) ─────────────────

  function pcm16ToBase64(pcm16: Int16Array): string {
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }

  // ── Open session ───────────────────────────────────────────────────────────

  const openLiveVoice = useCallback(
    async (_unused: string) => {
      if (sessionActiveRef.current) return;

      setState("connecting");

      try {
        // Fetch ephemeral token from our backend (keeps real key server-side)
        const tokenRes = await fetch("/api/live-token");
        if (!tokenRes.ok) throw new Error("Token fetch failed");
        const tokenData = await tokenRes.json();
        const token: string = tokenData.token;

        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          sessionActiveRef.current = true;

          // ── Setup message ──────────────────────────────────────────────────
          ws.send(
            JSON.stringify({
              setup: {
                model: `models/${GEMINI_MODEL}`,
                generationConfig: {
                  // Audio only — NO text transcription sent back
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      // "Aoede" has the best multilingual (AZ/RU/EN) quality
                      prebuiltVoiceConfig: { voiceName: "Aoede" },
                    },
                  },
                },
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
              },
            })
          );

          // ── Opening greeting (after setup is processed) ───────────────────
          setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) return;
            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    {
                      role: "user",
                      parts: [
                        {
                          text: "Azərbaycan dilində salamla. Qısa ol.",
                        },
                      ],
                    },
                  ],
                  turnComplete: true,
                },
              })
            );
          }, 600);

          setState("listening");
        };

        // ── Incoming messages ────────────────────────────────────────────────
        ws.onmessage = async (event) => {
          try {
            const text =
              event.data instanceof Blob
                ? await event.data.text()
                : (event.data as string);

            const msg = JSON.parse(text);

            // Audio chunks from model
            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                const md = part.inlineData;
                if (md?.mimeType?.startsWith("audio/pcm")) {
                  // Decode base64 → raw bytes
                  const raw = atob(md.data);
                  const bytes = new Uint8Array(raw.length);
                  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                  audioQueueRef.current.push(bytes.buffer);
                  if (!isPlayingRef.current) playNextAudio();
                }
              }
            }

            // User barge-in interruption
            if (msg?.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              if (sessionActiveRef.current) setState("listening");
            }

            // Model turn complete
            if (msg?.serverContent?.turnComplete) {
              if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                if (sessionActiveRef.current) setState("listening");
              }
            }
          } catch {
            // ignore parse errors silently
          }
        };

        ws.onerror = () => {
          onError?.("Canlı səs bağlantısında xəta baş verdi.");
          setState("idle");
        };

        ws.onclose = () => {
          sessionActiveRef.current = false;
          setState("idle");
        };

        // ── Microphone capture ───────────────────────────────────────────────
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;

        // Dedicated 16kHz context for capture
        const captureCtx = new AudioContext({ sampleRate: 16000 });
        captureCtxRef.current = captureCtx;

        const micSource = captureCtx.createMediaStreamSource(stream);
        sourceRef.current = micSource;

        // ScriptProcessorNode (4096 samples) — safe fallback for all browsers
        // AudioWorklet is ideal but requires serving an extra file; ScriptProcessor
        // works here since we only need one small chunk per ~256ms.
        const processor = captureCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!sessionActiveRef.current || ws.readyState !== WebSocket.OPEN) return;
          if (isPlayingRef.current) return; // don't capture while bot is speaking

          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
          }

          ws.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: "audio/pcm;rate=16000",
                    data: pcm16ToBase64(pcm16),
                  },
                ],
              },
            })
          );
        };

        micSource.connect(processor);
        // Connect to destination with zero gain so browser doesn't mute the node,
        // but output goes nowhere audible
        const silentGain = captureCtx.createGain();
        silentGain.gain.value = 0;
        processor.connect(silentGain);
        silentGain.connect(captureCtx.destination);
      } catch (err) {
        console.error("Live voice setup error:", err);
        onError?.("Mikrofona çıxış alınmadı və ya bağlantı xətası.");
        setState("idle");
        sessionActiveRef.current = false;
      }
    },
    [systemPrompt, setState, onError, playNextAudio]
  );

  // ── Close session ──────────────────────────────────────────────────────────

  const closeLiveVoice = useCallback(() => {
    sessionActiveRef.current = false;

    // Stop microphone
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    // Close AudioContexts
    captureCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current?.close().catch(() => {});

    // Close WebSocket
    wsRef.current?.close();

    // Clear queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;

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
