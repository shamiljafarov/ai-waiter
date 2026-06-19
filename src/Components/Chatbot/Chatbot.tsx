import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import { menuData } from "../../data/menuData";
import { pcmBase64ToWavUrl } from "./pcmToWav";
import azTranslations from "../i18n/locales/az.json";
import { useLiveVoice } from "./useLiveVoice";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function resolveTranslation(path: string): string | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = azTranslations;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

function buildDetailedMenuSummary(): string {
  const lines: string[] = [];
  for (const category of menuData) {
    for (const item of category.items) {
      const name = resolveTranslation(item.nameKey) ?? item.nameKey;
      lines.push(`- ${name}: ${item.price}₼${item.weight ? ` (${item.weight})` : ""}`);
    }
  }
  return lines.join("\n");
}

const DETAILED_MENU = buildDetailedMenuSummary();

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // **qalın**
    .replace(/\*(.*?)\*/g, "$1") // *italik*
    .replace(/__(.*?)__/g, "$1") // __qalın__
    .replace(/_(.*?)_/g, "$1") // _italik_
    .replace(/^#{1,6}\s+/gm, "") // # başlıqlar
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1"); // `kod`
}

const SYSTEM_PROMPT = `Sən Green Cafe restoranının AI köməkçisisən. Müştərilərə menyu haqqında məsləhət verirsən.

MƏNYU:
${DETAILED_MENU}

QAYDALAR:
- Müştəri hansı dildə danışsa və ya mesaj yazsa səndə o dildə ver cavabı
- Qısa, mehriban və praktik ol (2-4 cümlə)
- Əhval-ruhiyyəyə görə tövsiyə et: yorğun → yüngül yeməklər; ac → doyurucu yeməklər; şirin istəyir → desertlər
- Büdcəyə görə tövsiyə et
- Qiymətləri həmişə ₼ ilə göstər
- Restoran saatları: 09:00–23:00, ünvan: Şıxov qəs., Green City Resort
- Heç bir Markdown formatlaşdırması istifadə etmə (məsələn **qalın**, _italik_, # başlıq) — sadəcə adi mətn yaz, çünki cavabın adi mətn kimi göstərilir
- Müştərinin mesajı səsli mesajdan yazıya çevrilə bilər, ona görə bəzən söz formaları natamam, fonetik yazılmış və ya loru dildə ola bilər (məsələn "acam" = "acam", "neçiyə" = "neçəyə") — mənanı kontekstdən anla, qrammatik səhvə görə müştəridən soruşma, sadəcə nəzərdə tutduğunu başa düş və cavab ver`;

const LIVE_SYSTEM_PROMPT = `Sən Green Cafe restoranının canlı səsli AI ofisiantısan. Müştəri ilə real vaxtda, səslə danışırsan.

MƏNYU:
${DETAILED_MENU}

ROLUN:
- Sən peşəkar, nəzakətli restoran ofisiantısan
- Menyu barədə məlumat verirsən, yemək tövsiyə edirsən, sifariş qəbul edirsən, sualları cavablandırırsan
- Əhval-ruhiyyəyə görə tövsiyə et: yorğun → yüngül yeməklər; ac → doyurucu yeməklər; şirin istəyir → desertlər
- Büdcəyə görə tövsiyə et, qiymətləri manatla de
- Restoran saatları: 09:00–23:00, ünvan: Şıxov qəs., Green City Resort

DİL QAYDALARI (ÇOX VACİBDİR):
- Müştəri Azərbaycan dilində (istənilən ləhcədə — Bakı, Gəncə, Quba, Lənkəran və s.), rus dilində və ya ingilis dilində danışa bilər
- Müştərinin hansı dildə və ya ləhcədə danışmasından asılı olmayaraq, onun nə demək istədiyini düzgün başa düş
- Qeyri-rəsmi, loru danışıq formalarını da anla (məsələn "acam", "neçiyə", "nə var nə yox")
- Müştəri hansı dildə danışsa səndə o dildə ver cavabı
- Cavabların təmiz, səlis, nəzakətli, Bakı danışıq tərzinə yaxın və restoran mühitinə uyğun olsun
- Qısa və təbii danış (canlı söhbətdir, uzun monoloqlar demə)`;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Salam! 👋 Mən Green Cafe-nin AI köməkçisiyəm. Menyu haqqında sual verin, əhval-ruhiyyənizə və ya büdcənizə görə tövsiyə edim!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [liveUserText, setLiveUserText] = useState("");
  const [liveBotText, setLiveBotText] = useState("");

  const liveVoice = useLiveVoice({
    systemPrompt: LIVE_SYSTEM_PROMPT,
    onUserTranscript: (text) => setLiveUserText((prev) => prev + text),
    onModelTranscript: (text) => setLiveBotText((prev) => prev + text),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-large-v3");
      formData.append("language", "az");
      // Whisper-ə kontekst veririk: restoran mövzusu, danışıq dili, loru ifadələr
      formData.append(
        "prompt",
        "Bu, restoranda müştəri ilə süni intellekt köməkçisi arasında danışıq dilində, loru, gündəlik Azərbaycan dilində söhbətdir. Müştəri yemək, içki, qiymət, sifariş, əhval-ruhiyyə haqqında danışır. Məsələn: salam, neçə manatdı, acam, toxam, sifariş vermək istəyirəm, tövsiyə et, nə var, şirniyyat, şorba, salat, kabab."
      );
      formData.append("temperature", "0");

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        sendMessage(data.text);
      }
    } catch {
      alert("Səs tanınmadı, yenidən cəhd edin.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);

      // Təhlükəsizlik limiti: 2 dəqiqədən sonra avtomatik dayandır (unudulmuş mikrofon üçün)
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsListening(false);
        }
      }, 120000);
    } catch {
      alert("Mikrofona icazə verilmədi.");
    }
  };

  const stopSpeaking = () => {
    audioPlayerRef.current?.pause();
    if (audioPlayerRef.current) audioPlayerRef.current.currentTime = 0;
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    setIsSpeaking(false);
  };

  const speak = async (text: string) => {
    if (!ttsEnabled) return;

    stopSpeaking();

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error("TTS request failed", await response.text());
        return;
      }

      const { audio, mimeType } = await response.json();
      const url = pcmBase64ToWavUrl(audio, mimeType);
      currentAudioUrlRef.current = url;

      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      const player = audioPlayerRef.current;
      player.src = url;
      player.onplay = () => setIsSpeaking(true);
      player.onended = () => setIsSpeaking(false);
      player.onerror = () => setIsSpeaking(false);
      await player.play();
    } catch (err) {
      console.error("TTS playback error", err);
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput("");
    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        }),
      });

      const data = await response.json();
      const assistantText =
        data.choices?.[0]?.message?.content || "Bağışlayın, cavab verə bilmədim.";

      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      setIsLoading(false);
      // TTS arxa fonda işləsin, mətn cavabını gözlətmir
      speak(stripMarkdown(assistantText));
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xəta baş verdi. Bir az sonra yenidən cəhd edin." },
      ]);
      setIsLoading(false);
    }
  };

  const openLiveVoice = () => {
    setLiveUserText("");
    setLiveBotText("");
    setIsLiveOpen(true);
    liveVoice.start();
  };

  const closeLiveVoice = () => {
    liveVoice.stop();
    setIsLiveOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickMessages = [
    "Bu gün çox acam 🍽️",
    "Yüngül bir şey istəyirəm",
    "Büdcəm 10₼-dir",
    "Şirin bir şey tövsiyə et 🍰",
  ];

  const micBusy = isListening || isTranscribing;

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition hover:bg-stone-700 active:scale-95"
        aria-label="AI köməkçi"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[340px] flex-col rounded-2xl border border-stone-200 bg-[#f6f6f2] shadow-2xl sm:w-[380px]">
          <div className="flex items-center justify-between rounded-t-2xl border-b border-stone-200 bg-stone-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Köməkçi</p>
                <p className="text-[10px] text-stone-400">Green Cafe</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openLiveVoice}
                className="rounded-full p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white"
                title="Canlı danış"
              >
                <Phone size={16} />
              </button>
              <button
                onClick={() => {
                  setTtsEnabled((v) => !v);
                  if (isSpeaking) stopSpeaking();
                }}
                className="rounded-full p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white"
                title={ttsEnabled ? "Səsi söndür" : "Səsi aç"}
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>

          <div className="flex h-72 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-800 shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? stripMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

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

          {messages.length <= 1 && (
            <div className="border-t border-stone-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                Sürətli suallar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickMessages.map((q) => (
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

          <div className="flex items-center gap-2 border-t border-stone-200 p-3">
            <button
              onClick={toggleListening}
              disabled={isTranscribing}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition ${
                isListening
                  ? "animate-pulse bg-red-500 text-white"
                  : isTranscribing
                  ? "bg-amber-400 text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
              title={isListening ? "Dayandır" : isTranscribing ? "Çevrilir..." : "Səslə yaz"}
            >
              {micBusy ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Danışın..."
                  : isTranscribing
                  ? "Çevrilir..."
                  : "Mesaj yazın..."
              }
              disabled={isLoading || isTranscribing}
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
      {isLiveOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-stone-950/95 px-6 py-10">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium text-stone-300">Green Cafe AI Köməkçi</p>
            <p className="text-xs text-stone-500">
              {liveVoice.status === "connecting" && "Qoşulur..."}
              {liveVoice.status === "listening" && "Dinləyir..."}
              {liveVoice.status === "speaking" && "Danışır..."}
              {liveVoice.status === "error" && "Xəta baş verdi"}
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div
              className={`flex h-40 w-40 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                liveVoice.status === "speaking"
                  ? "scale-110 border-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.4)]"
                  : liveVoice.status === "listening"
                  ? "scale-100 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                  : "scale-95 border-stone-600"
              }`}
            >
              <div
                className={`h-28 w-28 rounded-full bg-gradient-to-br from-stone-100 to-stone-300 transition-transform duration-300 ${
                  liveVoice.status === "speaking" ? "animate-pulse" : ""
                }`}
              />
            </div>

            {(liveUserText || liveBotText) && (
              <div className="max-w-sm space-y-2 text-center">
                {liveUserText && <p className="text-sm text-stone-400">Siz: {liveUserText}</p>}
                {liveBotText && <p className="text-sm text-white">{liveBotText}</p>}
              </div>
            )}
          </div>

          <button
            onClick={closeLiveVoice}
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