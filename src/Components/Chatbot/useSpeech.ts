import { useRef, useState } from "react";

interface UseSpeechOptions {
  onTranscript: (text: string) => void | Promise<void>;
}

export function useSpeech({ onTranscript }: UseSpeechOptions) {
  // STT (push-to-talk)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Push-to-talk recording ─────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAndSend(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Safety limit: stop after 2 minutes
      stopTimerRef.current = setTimeout(() => stopRecording(), 120_000);
    } catch {
      alert("Mikrofona icazə verilmədi.");
    }
  };

  const stopRecording = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const transcribeAndSend = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const res = await fetch("/api/gemini-stt", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: blob,
      });
      if (!res.ok) {
        alert("Səs tanınmadı, yenidən cəhd edin.");
        return;
      }
      const data = await res.json();
      if (data.text?.trim()) {
        await onTranscript(data.text);
      } else {
        alert("Səs tanınmadı, yenidən cəhd edin.");
      }
    } catch {
      alert("Səs tanınmadı, yenidən cəhd edin.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
