import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Phone,
  Loader2,
  Mic,
  MicOff,
  Send,
} from "lucide-react";
import { menuData } from "../../data/menuData";
import { useChat, stripMarkdown, LIVE_SYSTEM_PROMPT, QUICK_MESSAGES } from "../Chatbot/useChat";
import { useSpeech } from "../Chatbot/useSpeech";
import { useLiveVoice, type LiveState } from "../Chatbot/useLiveVoice";
import LiveVoiceOverlay from "../Chatbot/LiveVoiceOverlay";
import CompactFoodCard from "../Cards/CompactFoodCard";
import OrderPanel from "./OrderPanel";
import BackButton from "../BackButton/BackButton";
import { useOrder } from "../../context/OrderContext";

type Screen = "landing" | "menu" | "aiwaiter" | "checkout";
type MobileTab = "chat" | "menu" | "order";

type AiWaiterScreenProps = {
  onNavigate: (screen: Screen) => void;
};

const languages = ["az", "en", "ru"] as const;
type Language = (typeof languages)[number];

const DESKTOP_BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handleChange = () => setIsDesktop(mql.matches);
    handleChange();
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

export default function AiWaiterScreen({ onNavigate }: AiWaiterScreenProps) {
  const { t, i18n } = useTranslation();
  const isDesktop = useIsDesktop();
  const { orderItems, total, applyOrderCommands } = useOrder();

  const currentLanguage = (i18n.language?.split("-")[0] || "az") as Language;
  const handleLanguageChange = (lang: Language) => i18n.changeLanguage(lang);

  // ─── Menu panel ───────────────────────────────────────────────────────────
  const categories = menuData.map((category) => ({
    key: category.key,
    titleKey: category.titleKey,
  }));
  const [activeCategory, setActiveCategory] = useState(categories[0]?.key || "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const handleCategoryClick = (categoryKey: string) => {
    setActiveCategory(categoryKey);
    sectionRefs.current[categoryKey]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ─── AI chat ────────────────────────────────────────────────────────────────
  const { messages, input, setInput, isLoading, sendMessage, messagesEndRef } =
    useChat({ onOrderCommands: applyOrderCommands });
  const { isRecording, isTranscribing, toggleRecording } = useSpeech({
    onTranscript: sendMessage,
  });

  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveState>("idle");

  const liveVoice = useLiveVoice({
    systemPrompt: LIVE_SYSTEM_PROMPT,
    onStateChange: (state) => setLiveStatus(state),
    onError: (err) => console.error("Live voice error:", err),
    onOrderCommand: (command) => applyOrderCommands([command]),
  });

  const openLive = () => {
    setIsLiveOpen(true);
    liveVoice.openLiveVoice("");
  };

  const closeLive = () => {
    liveVoice.closeLiveVoice();
    setIsLiveOpen(false);
    setLiveStatus("idle");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const micBusy = isRecording || isTranscribing;
  const inputDisabled = isLoading || isTranscribing;
  const isConversationEmpty = messages.length <= 1;

  // ─── Mobile-only state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<MobileTab>("chat");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAddedToast = () => {
    setToastKey((k) => k + 1);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 1500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const orderCount = orderItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const hasOrder = orderItems.length > 0;

  const mobileTabs: { key: MobileTab; label: string }[] = [
    { key: "chat", label: t("aiwaiter.tabs.chat") },
    { key: "menu", label: t("aiwaiter.tabs.menu") },
    { key: "order", label: t("aiwaiter.tabs.order") },
  ];

  // ─── Shared panel bodies (reused by desktop grid + mobile tabs) ────────────
  const menuBody = (
    <>
      <div className="no-scrollbar flex shrink-0 gap-5 overflow-x-auto border-b border-stone-100 px-4 py-3">
        {categories.map((category) => {
          const isActive = activeCategory === category.key;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => handleCategoryClick(category.key)}
              className={`whitespace-nowrap border-b-2 pb-1 text-xs transition ${
                isActive
                  ? "border-[#9f7d1c] text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {t(category.titleKey)}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-5">
          {menuData.map((category) => (
            <div
              key={category.key}
              ref={(el) => {
                sectionRefs.current[category.key] = el;
              }}
            >
              <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                {t(category.titleKey)}
              </h3>
              <div className="space-y-1.5">
                {category.items.map((item) => (
                  <CompactFoodCard key={item.id} item={item} onAdd={showAddedToast} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const chatBody = (
    <>
      {isConversationEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="font-serif text-3xl text-stone-900">
            {t("aiwaiter.greeting")}
          </h2>
          <p className="max-w-sm text-sm text-stone-600">
            {t("aiwaiter.subtitle")}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {QUICK_MESSAGES.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 transition hover:bg-stone-900 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-50 text-stone-800"
                }`}
              >
                {msg.role === "assistant"
                  ? stripMarkdown(msg.content)
                  : msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-stone-50 px-4 py-3">
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
      )}

      {/* Input row */}
      <div className="flex shrink-0 items-center gap-2 border-t border-stone-200 p-3">
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

        <button
          onClick={openLive}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
          title="Canlı danış"
        >
          <Phone size={16} />
        </button>
      </div>
    </>
  );

  return (
    <div
      className={
        isDesktop
          ? "flex h-screen flex-col bg-[#f6f6f2]"
          : "flex h-dvh flex-col bg-[#f6f6f2]"
      }
    >
      {isDesktop ? (
        <>
          {/* Top bar */}
          <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <BackButton
                onClick={() => onNavigate("landing")}
                size={36}
                iconSize={18}
              />

              <div>
                <p className="font-serif text-base leading-none text-stone-900">
                  {t("brand.name")}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">
                  {t("brand.tagline")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white/60 p-1">
              {languages.map((lang) => {
                const isActive = currentLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase transition ${
                      isActive
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </header>

          {/* 3-panel body */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(300px,1.1fr)_1.4fr_minmax(320px,1.1fr)] lg:overflow-hidden">
              {/* LEFT — compact menu */}
              <div className="flex h-[70vh] min-h-0 flex-col overflow-hidden rounded-2xl bg-white lg:h-full">
                {menuBody}
              </div>

              {/* CENTER — AI chat */}
              <div className="flex h-[70vh] min-h-0 flex-col overflow-hidden rounded-2xl bg-white lg:h-full">
                {chatBody}
              </div>

              {/* RIGHT — order panel */}
              <div className="h-[70vh] min-h-0 overflow-hidden lg:h-full">
                <OrderPanel onNavigate={onNavigate} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Compact top bar */}
          <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <BackButton
                onClick={() => onNavigate("landing")}
                size={32}
                iconSize={16}
              />
              <p className="font-serif text-sm leading-none text-stone-900">
                {t("brand.name")}
              </p>
            </div>

            <div className="flex items-center gap-0.5 rounded-full border border-stone-200 bg-white/60 p-0.5">
              {languages.map((lang) => {
                const isActive = currentLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase transition ${
                      isActive
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Segmented control */}
          <div className="sticky top-0 z-10 shrink-0 bg-[#f6f6f2] py-2">
            <div className="mx-4 flex items-center gap-1 rounded-full bg-stone-200/60 p-1">
              {mobileTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-white text-[#9f7d1c] shadow-sm"
                        : "text-stone-600"
                    }`}
                  >
                    {tab.label}
                    {tab.key === "order" && hasOrder && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9f7d1c] px-1 text-[10px] font-semibold text-white">
                        {orderCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content — all three stay mounted, visibility toggled via CSS */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={`flex h-full min-h-0 flex-col ${
                activeTab === "chat" ? "" : "hidden"
              }`}
            >
              {chatBody}
            </div>
            <div
              className={`flex h-full min-h-0 flex-col ${
                activeTab === "menu" ? "" : "hidden"
              }`}
            >
              {menuBody}
            </div>
            <div className={`h-full ${activeTab === "order" ? "" : "hidden"}`}>
              <OrderPanel onNavigate={onNavigate} />
            </div>
          </div>

          {/* Persistent bottom summary bar */}
          {hasOrder && activeTab !== "order" && (
            <div
              className="shrink-0 rounded-t-2xl border-t border-stone-200 bg-white px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-700">
                  {t("order.summaryBar", { count: orderCount, total: total.toFixed(2) })}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("order")}
                  className="shrink-0 rounded-full bg-[#9f7d1c] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#8a6c17]"
                >
                  {t("order.viewOrder")}
                </button>
              </div>
            </div>
          )}

          {/* Add-to-order toast */}
          {toastVisible && (
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
              <span
                key={toastKey}
                className="animate-toast rounded-full bg-stone-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg"
              >
                {t("order.addedToast")}
              </span>
            </div>
          )}
        </>
      )}

      {isLiveOpen && <LiveVoiceOverlay status={liveStatus} onClose={closeLive} />}
    </div>
  );
}
