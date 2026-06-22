import { useRef, useCallback } from "react";

const GEMINI_MODEL = "gemini-2.0-flash-live-001";

interface UseLiveVoiceOptions {
  systemPrompt: string;
  onStateChange?: (state: "idle" | "listening" | "speaking") => void;
  onError?: (error: string) => void;
}

export function useLiveVoice({ systemPrompt, onStateChange, onError }: UseLiveVoiceOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const setState = useCallback(
    (state: "idle" | "listening" | "speaking") => {
      onStateChange?.(state);
    },
    [onStateChange]
  );

  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setState("speaking");

    const audioData = audioQueueRef.current.shift()!;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      const buffer = await ctx.decodeAudioData(audioData.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        } else {
          setState("listening");
        }
      };
      source.start();
    } catch {
      isPlayingRef.current = false;
      playNextAudio();
    }
  }, [setState]);

  const openLiveVoice = useCallback(
    async (apiKey: string) => {
      if (sessionActiveRef.current) return;

      try {
        // Fetch token from our backend
        const tokenRes = await fetch("/api/live-token");
        const tokenData = await tokenRes.json();
        const token = tokenData.token || apiKey;

        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          sessionActiveRef.current = true;

          // Send setup message — no transcription requested (voice only)
          const setupMsg = {
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
                parts: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            },
          };

          ws.send(JSON.stringify(setupMsg));

          // Send opening greeting instruction
          setTimeout(() => {
            const greetMsg = {
              clientContent: {
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Azərbaycan dilində salamla. Tələffüz qaydaları: 
- "Ç" hərfini [tʃ] kimi tələffüz et (ingilis "ch" kimi), heç vaxt "Ц" [ts] kimi yox.
- "Ş" hərfini [ʃ] kimi tələffüz et (ingilis "sh" kimi).
- "X" hərfini [x] kimi tələffüz et (boğaz "x" səsi).
- "Q" hərfini [ɡ] kimi tələffüz et (arxa damaq "g").
- Bütün sözləri rəsmi Azərbaycan ədəbi dili fonetikası ilə tələffüz et.
- Rus, türk və ya digər dillərin fonetikasına keçmə.
İndi salamla.`,
                      },
                    ],
                  },
                ],
                turnComplete: true,
              },
            };
            ws.send(JSON.stringify(greetMsg));
          }, 500);

          setState("listening");
        };

        ws.onmessage = async (event) => {
          try {
            let text: string;
            if (event.data instanceof Blob) {
              text = await event.data.text();
            } else {
              text = event.data;
            }

            const msg = JSON.parse(text);

            // Handle audio response
            const parts = msg?.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.mimeType?.startsWith("audio/")) {
                  const audioBytes = Uint8Array.from(atob(part.inlineData.data), (c) =>
                    c.charCodeAt(0)
                  );
                  audioQueueRef.current.push(audioBytes.buffer);
                  if (!isPlayingRef.current) {
                    playNextAudio();
                  }
                }
              }
            }

            // Handle interruption (user barge-in)
            if (msg?.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setState("listening");
            }

            // Turn complete
            if (msg?.serverContent?.turnComplete) {
              if (audioQueueRef.current.length === 0 && !isPlayingRef.current) {
                setState("listening");
              }
            }
          } catch {
            // ignore parse errors
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

        // Start microphone capture
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Use ScriptProcessor to capture PCM16 audio
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!sessionActiveRef.current || ws.readyState !== WebSocket.OPEN) return;

          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
          }

          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

          const audioMsg = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64,
                },
              ],
            },
          };

          ws.send(JSON.stringify(audioMsg));
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      } catch (err) {
        console.error("Live voice error:", err);
        onError?.("Mikrofona çıxış alınmadı və ya bağlantı xətası.");
        setState("idle");
      }
    },
    [systemPrompt, setState, onError, playNextAudio]
  );

  const closeLiveVoice = useCallback(() => {
    sessionActiveRef.current = false;

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    wsRef.current?.close();
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    wsRef.current = null;

    setState("idle");
  }, [setState]);

  const sendTextToLive = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const msg = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    wsRef.current.send(JSON.stringify(msg));
  }, []);

  return { openLiveVoice, closeLiveVoice, sendTextToLive };
}
