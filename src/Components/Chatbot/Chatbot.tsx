import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, AudioLines, PhoneOff, Loader2 } from "lucide-react";
import { menuData } from "../../data/menuData";
import azTranslations from "../i18n/locales/az.json";
import ruTranslations from "../i18n/locales/ru.json";
import enTranslations from "../i18n/locales/en.json";
import { useLiveVoice, type LiveState } from "./useLiveVoice";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ─── Translation helpers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = obj;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

// Build menu summary in all three languages for the system prompt
function buildMenuSummary(): string {
  const lines: string[] = [];

  for (const category of menuData) {
    const catAz = getNestedValue(azTranslations, category.titleKey) ?? category.key;
    const catEn = getNestedValue(enTranslations, category.titleKey) ?? category.key;
    const catRu = getNestedValue(ruTranslations, category.titleKey) ?? category.key;

    lines.push(`\n[${catAz} / ${catEn} / ${catRu}]`);

    for (const item of category.items) {
      const nameAz = getNestedValue(azTranslations, item.nameKey) ?? item.nameKey;
      const nameEn = getNestedValue(enTranslations, item.nameKey) ?? item.nameKey;
      const nameRu = getNestedValue(ruTranslations, item.nameKey) ?? item.nameKey;
      const weight = item.weight ? ` (${item.weight})` : "";
      lines.push(`  • ${nameAz} / ${nameEn} / ${nameRu} — ${item.price}₼${weight}`);
    }
  }

  return lines.join("\n");
}

const MENU_TEXT = buildMenuSummary();

// ─── Strip markdown from assistant replies ────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    .trim();
}

// ─── System Prompts ───────────────────────────────────────────────────────────

/**
 * Chat system prompt.
 * Key improvements for Azerbaijani:
 *  - Explicit instruction to reply in the EXACT language the user writes in
 *  - Menu items listed in all three languages so the model can match them
 *  - No markdown, short replies
 */
const CHAT_SYSTEM_PROMPT = `You are the AI waiter of Green Cafe restaurant. Your ONLY job is to help guests with the menu, food and drinks, prices, allergens, and restaurant information.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE RULE — ABSOLUTE PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detect the language of the user's message and reply IN THAT SAME LANGUAGE.
• If the user writes in Azerbaijani → reply only in Azerbaijani
• If the user writes in Russian → reply only in Russian
• If the user writes in English → reply only in English
Never mix languages in one reply. Never switch unless the user switches first.

When speaking Azerbaijani:
- Use proper literary Azerbaijani (ədəbi dil), not Turkish or Russian phonetics.
- Use the formal "Siz" form of address.
- Dish names: use the Azerbaijani names from the menu below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE — STRICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You ONLY discuss:
• The menu (food, drinks, prices, portions, ingredients)
• Order recommendations and upselling
• Restaurant info: hours 09:00–23:00, address: Şıxov qəs., Green City Resort, phone: +994 99 206 20 84

For ANY other topic (science, politics, coding, jokes, personal questions, etc.) reply:
- AZ: "Üzr istəyirəm, mən yalnız Green Cafe menyusu ilə kömək edə bilərəm. Sizə nə təklif edim?"
- RU: "Извините, я могу помочь только с меню Green Cafe. Что вам предложить?"
- EN: "Sorry, I can only help with the Green Cafe menu. What can I get for you?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Short, warm, practical (2–4 sentences)
• No markdown: no bold (**), no headers (#), no bullet lists in chat
• Show prices with ₼
• After a guest picks a dish, naturally suggest one matching drink or side
• Never be pushy — one suggestion per turn is enough

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENU (Azerbaijani / English / Russian — price in ₼)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${MENU_TEXT}`;

/**
 * Live voice system prompt.
 * Optimised for spoken Azerbaijani — phoneme guidance for TTS.
 */
const LIVE_SYSTEM_PROMPT = `Sən Green Cafe restoranının AI ofisiantısan. Azərbaycan, rus və ingilis dillərini bilirsən.

DİL QAYDASI: Müştəri hansı dildə danışırsa, sən də HƏMİN DİLDƏ cavab ver.

Azərbaycan dilində danışarkən:
• Rəsmi ədəbi Azərbaycan dili işlət.
• "Siz" müraciət formasını işlət.
• Ç = [tʃ] (ingilis "ch" kimi), Ş = [ʃ] (ingilis "sh"), X = [x] (boğaz səsi), Q = [ɡ] (arxa damaq).
• Rus, türk fonetikasından istifadə etmə.
• Sözü tam tələffüz et, heç bir hərf udma.

VƏZİFƏ: Menyunu izah et, tövsiyə ver, sifariş al.
Yalnız restoran mövzusu. Digər mövzulara cavab vermə.

CAVAB FORMATI: Qısa, mehriban. 1-3 cümlə. Yalnız mətn — heç bir markdown.

RESTORAN: Green Cafe, Şıxov, Green City Resort. Saat: 09:00–23:00.`;

// ─── Quick reply chips (3 languages) ─────────────────────────────────────────

const QUICK_MESSAGES = [
  "Bu gün çox acam 🍽️",
  "Yüngül bir şey istəyirəm",
  "Büdcəm 10₼-dir",
  "Что посоветуете?",
  "What's popular here?",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Salam! Green Cafe-yə xoş gəlmisiniz. Mən sizin AI ofisiantınızam — menyu, qiymətlər, tövsiyələr barədə kömək edə bilərəm. Hansı dildə rahat danışırsınızsa, həmin dildə yazın.\n\nЗдравствуйте! Я AI-официант Green Cafe. Пишите на любом языке.\n\nHello! I'm your AI waiter at Green Cafe. Write in any language you prefer.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // STT (push-to-talk)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live voice
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveState>("idle");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const liveVoice = useLiveVoice({
    systemPrompt: LIVE_SYSTEM_PROMPT,
    onStateChange: (state) => setLiveStatus(state),
    onError: (err) => console.error("Live voice error:", err),
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ─── Send text message via backend proxy ────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    setInput("");
    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Route through /api/chat so the API key stays on the server
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: CHAT_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const assistantText: string =
        data.content ?? "Bağışlayın, cavab verə bilmədim.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantText },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
      const res = await fetch("/api/azure-stt", {
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
        await sendMessage(data.text);
      } else {
        alert("Səs tanınmadı, yenidən cəhd edin.");
      }
    } catch {
      alert("Səs tanınmadı, yenidən cəhd edin.");
    } finally {
      setIsTranscribing(false);
    }
  };

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

  const liveStatusLabel: Record<LiveState, string> = {
    idle: "Qoşulur...",
    connecting: "Qoşulur...",
    listening: "Dinləyir...",
    speaking: "Danışır...",
  };

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
      {isLiveOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-stone-950/97 px-6 py-12">
          {/* Top label */}
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium text-stone-300">
              Green Cafe · Canlı Danışıq
            </p>
            <p className="text-xs text-stone-500">
              {liveStatusLabel[liveStatus]}
            </p>
          </div>

          {/* Animated orb — NO transcript shown, audio only */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div
              className={`relative flex h-44 w-44 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                liveStatus === "speaking"
                  ? "scale-110 border-emerald-400 shadow-[0_0_70px_rgba(52,211,153,0.45)]"
                  : liveStatus === "listening"
                  ? "scale-100 border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                  : "scale-95 border-stone-700"
              }`}
            >
              <div
                className={`h-32 w-32 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 transition-all duration-300 ${
                  liveStatus === "speaking" ? "animate-pulse" : ""
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
            onClick={closeLive}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
            title="Söhbəti bitir"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      )}
    </>
  );
}
