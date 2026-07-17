import { PhoneOff } from "lucide-react";
import type { LiveState } from "./useLiveVoice";

type LiveVoiceOverlayProps = {
  status: LiveState;
  onClose: () => void;
};

const LIVE_STATUS_LABEL: Record<LiveState, string> = {
  idle: "Qoşulur...",
  connecting: "Qoşulur...",
  listening: "Dinləyir...",
  speaking: "Danışır...",
};

export default function LiveVoiceOverlay({ status, onClose }: LiveVoiceOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-stone-950/97 px-6 py-12">
      {/* Top label */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-stone-300">
          Green Cafe · Canlı Danışıq
        </p>
        <p className="text-xs text-stone-500">{LIVE_STATUS_LABEL[status]}</p>
      </div>

      {/* Animated orb — NO transcript shown, audio only */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div
          className={`relative flex h-44 w-44 items-center justify-center rounded-full border-4 transition-all duration-300 ${
            status === "speaking"
              ? "scale-110 border-emerald-400 shadow-[0_0_70px_rgba(52,211,153,0.45)]"
              : status === "listening"
              ? "scale-100 border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              : "scale-95 border-stone-700"
          }`}
        >
          <div
            className={`h-32 w-32 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 transition-all duration-300 ${
              status === "speaking" ? "animate-pulse" : ""
            }`}
          />
        </div>

        {/* Subtle hint — language note, no transcript */}
        <p className="max-w-[240px] text-center text-xs leading-5 text-stone-500">
          Azərbaycan, Русский, English — istədiyiniz dildə danışın
        </p>
      </div>

      {/* End call button */}
      <button
        onClick={onClose}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
        title="Söhbəti bitir"
      >
        <PhoneOff size={22} />
      </button>
    </div>
  );
}
