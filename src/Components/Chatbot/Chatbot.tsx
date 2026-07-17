import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, AudioLines, Loader2 } from "lucide-react";
import { useLiveVoice, type LiveState } from "./useLiveVoice";
import { useChat, stripMarkdown, LIVE_SYSTEM_PROMPT, QUICK_MESSAGES } from "./useChat";
import { useSpeech } from "./useSpeech";
import LiveVoiceOverlay from "./LiveVoiceOverlay";
import { useOrder } from "../../context/OrderContext";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { applyOrderCommands } = useOrder();

  const { messages, input, setInput, isLoading, sendMessage, messagesEndRef } =
    useChat({ onOrderCommands: applyOrderCommands });

  const { isRecording, isTranscribing, toggleRecording } = useSpeech({
    onTranscript: sendMessage,
  });

  // Live voice
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveState>("idle");

  const inputRef = useRef<HTMLInputElement>(null);

  const liveVoice = useLiveVoice({
    systemPrompt: LIVE_SYSTEM_PROMPT,
    onStateChange: (state) => setLiveStatus(state),
    onError: (err) => console.error("Live voice error:", err),
    onOrderCommand: (command) => applyOrderCommands([command]),
  });

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ─── Live voice ─────────────────────────────────────────────────────────────

  const openLive = () => {
    setIsLiveOpen(true);
    liveVoice.openLiveVoice("");
  };

  const closeLive = () => {
    liveVoice.closeLiveVoice();
    setIsLiveOpen(false);
    setLiveStatus("idle");
  };

  // ─── Keyboard handler ───────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Derived state ──────────────────────────────────────────────────────────

  const micBusy = isRecording || isTranscribing;
  const inputDisabled = isLoading || isTranscribing;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition hover:bg-stone-700 active:scale-95"
        aria-label="AI köməkçi"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[340px] flex-col rounded-2xl border border-stone-200 bg-[#f6f6f2] shadow-2xl sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-stone-200 bg-stone-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Köməkçi</p>
                <p className="text-[10px] text-stone-400">Green Cafe · AZ / RU / EN</p>
              </div>
            </div>
            {/* Live voice button */}
            <button
              onClick={openLive}
              className="rounded-full p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white"
              title="Canlı danış"
            >
              <AudioLines size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex h-72 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-800 shadow-sm"
                  }`}
                >
                  {msg.role === "assistant"
                    ? stripMarkdown(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick messages (shown only at start) */}
          {messages.length <= 1 && (
            <div className="border-t border-stone-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                Sürətli suallar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MESSAGES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 transition hover:bg-stone-900 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="flex items-center gap-2 border-t border-stone-200 p-3">
            {/* Mic button (push-to-talk) */}
            <button
              onClick={toggleRecording}
              disabled={inputDisabled}
              title={isRecording ? "Dayandır" : "Danış"}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition ${
                isRecording
                  ? "animate-pulse bg-red-500 text-white"
                  : isTranscribing
                  ? "bg-stone-200 text-stone-400"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              } disabled:opacity-40`}
            >
              {isTranscribing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isRecording ? (
                <MicOff size={15} />
              ) : (
                <Mic size={15} />
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? "Danışın..."
                  : isTranscribing
                  ? "Çevrilir..."
                  : "Mesaj yazın..."
              }
              disabled={inputDisabled || micBusy}
              className="min-w-0 flex-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-60"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-white transition hover:bg-stone-700 disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Live Voice fullscreen overlay ─────────────────────────────────── */}
      {isLiveOpen && <LiveVoiceOverlay status={liveStatus} onClose={closeLive} />}
    </>
  );
}
