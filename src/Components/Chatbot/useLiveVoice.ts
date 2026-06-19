import { useRef, useState, useCallback } from "react";
import { GoogleGenAI, Modality, type Session, type LiveServerMessage } from "@google/genai";

const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export type LiveStatus = "idle" | "connecting" | "listening" | "speaking" | "error";

function floatTo16BitPCM(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

interface UseLiveVoiceOptions {
  systemPrompt: string;
  onUserTranscript?: (text: string) => void;
  onModelTranscript?: (text: string) => void;
}

export function useLiveVoice({ systemPrompt, onUserTranscript, onModelTranscript }: UseLiveVoiceOptions) {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const statusRef = useRef<LiveStatus>("idle");

  const sessionRef = useRef<Session | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const outputContextRef = useRef<AudioContext | null>(null);
  const playbackTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const setStatusSafe = (s: LiveStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // artıq dayanıb
      }
    });
    activeSourcesRef.current = [];
    if (outputContextRef.current) {
      playbackTimeRef.current = outputContextRef.current.currentTime;
    }
  }, []);

  const stop = useCallback(() => {
    try {
      sessionRef.current?.close();
    } catch {
      // bağlanıb
    }
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    outputContextRef.current?.close();

    sessionRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    outputContextRef.current = null;
    playbackTimeRef.current = 0;
    activeSourcesRef.current = [];

    setStatusSafe("idle");
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!outputContextRef.current) {
      outputContextRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      playbackTimeRef.current = outputContextRef.current.currentTime;
    }
    const ctx = outputContextRef.current;

    const pcm16 = base64ToInt16Array(base64Audio);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

    const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, playbackTimeRef.current);
    source.start(startAt);
    playbackTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    setStatusSafe("speaking");

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (
        activeSourcesRef.current.length === 0 &&
        outputContextRef.current &&
        playbackTimeRef.current <= outputContextRef.current.currentTime + 0.1 &&
        statusRef.current !== "idle"
      ) {
        setStatusSafe("listening");
      }
    };
  }, []);

  const startMicrophone = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    const bufferSize = 4096;
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const session = sessionRef.current;
      if (!session) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16Buffer = floatTo16BitPCM(inputData);
      const base64Audio = arrayBufferToBase64(pcm16Buffer);
      try {
        session.sendRealtimeInput({
          audio: { data: base64Audio, mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
        });
      } catch {
        // sessiya bağlanıb
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  }, []);

  const start = useCallback(async () => {
    setStatusSafe("connecting");
    try {
      // 1) Serverdən ephemeral token al
      const tokenRes = await fetch("/api/live-token", { method: "POST" });
      if (!tokenRes.ok) {
        const errBody = await tokenRes.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || "Token alına bilmədi");
      }
      const { token } = await tokenRes.json();

      // 2) Token ilə Live API-yə qoşul (SDK WebSocket-i idarə edir)
      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });

      const session = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemPrompt,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            await startMicrophone();
            setStatusSafe("listening");
          },
          onmessage: (message: LiveServerMessage) => {
            const sc = message.serverContent;
            if (!sc) return;

            if (sc.inputTranscription?.text) {
              onUserTranscript?.(sc.inputTranscription.text);
            }
            if (sc.outputTranscription?.text) {
              onModelTranscript?.(sc.outputTranscription.text);
            }

            // Barge-in: istifadəçi botu kəsdi → çalınan səsi dayandır
            if (sc.interrupted) {
              stopPlayback();
              if (statusRef.current !== "idle") setStatusSafe("listening");
              return;
            }

            const parts = sc.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                const data = part.inlineData?.data;
                if (data) playAudioChunk(data);
              }
            }
          },
          onerror: () => {
            setStatusSafe("error");
          },
          onclose: () => {
            if (statusRef.current !== "idle") setStatusSafe("idle");
          },
        },
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Live voice start error", err);
      setStatusSafe("error");
    }
  }, [systemPrompt, playAudioChunk, startMicrophone, stopPlayback, onUserTranscript, onModelTranscript]);

  return { status, start, stop };
}
