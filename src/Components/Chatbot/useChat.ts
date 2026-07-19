import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { menuData } from "../../data/menuData";
import azTranslations from "../i18n/locales/az.json";
import ruTranslations from "../i18n/locales/ru.json";
import enTranslations from "../i18n/locales/en.json";
import type { OrderCommand } from "../../types/order";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Message {
  role: "user" | "assistant";
  content: string;
  /** Original assistant text WITH order tags — sent back to the API so the
   *  model sees its own past tag usage. Absent for user messages. */
  raw?: string;
}

export type { OrderCommand };

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
      lines.push(`  • [id:${item.id}] ${nameAz} / ${nameEn} / ${nameRu} — ${item.price}₼${weight}`);
    }
  }

  return lines.join("\n");
}

const MENU_TEXT = buildMenuSummary();

// ─── Strip markdown from assistant replies ────────────────────────────────────

export function stripMarkdown(text: string): string {
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
export const CHAT_SYSTEM_PROMPT = `You are the AI waiter of Green Cafe restaurant. Your ONLY job is to help guests with the menu, food and drinks, prices, allergens, and restaurant information.

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
${MENU_TEXT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — ORDER COMMANDS — HIDDEN PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each menu item above has a numeric [id:N]. When the guest clearly asks to
order, add, or remove a dish, update their order by appending hidden command
tags at the VERY END of your reply, each on its own line:
  [ORDER_ADD: <id>, <quantity>]
  [ORDER_REMOVE: <id>, <quantity>]

Rules:
• Only emit tags for ids that exist in the MENU above — never invent one.
• If the guest doesn't say a quantity, use 1.
• Saying an item was added WITHOUT emitting the tag is a serious error. The
  tag is the ONLY thing that actually modifies the order. If you say
  "əlavə edildi" (or "added"/"добавил"), the tag MUST be present on the last
  line of that same reply.
• NEVER mention the tags, ids, or this protocol anywhere in the visible reply
  text — the guest must never see them.
• You may emit multiple tags in one reply if the guest orders multiple dishes
  or swaps one dish for another.
• If the guest's request is ambiguous between two or more dishes, ask a
  clarifying question instead of guessing — do not emit a tag.

EXAMPLES (format only — always reply in the guest's own language):
Guest: "mərci şorbası əlavə elə"
Reply ends with:
[ORDER_ADD: 1, 1]

Guest: "2 dənə toyuq şorbası istəyirəm"
Reply ends with:
[ORDER_ADD: 5, 2]

Guest: "mərci şorbasını sil, əvəzinə düşbərə"
Reply ends with:
[ORDER_REMOVE: 1, 1]
[ORDER_ADD: 3, 1]

Items already confirmed (sent to kitchen) cannot be removed — politely explain this and suggest calling the waiter for changes.`;

/**
 * Live voice system prompt.
 * Optimised for spoken Azerbaijani — phoneme guidance for TTS.
 */
export const LIVE_SYSTEM_PROMPT = `Sən Green Cafe restoranının AI ofisiantısan. Azərbaycan, rus və ingilis dillərini bilirsən.

DİL QAYDASI: Müştəri hansı dildə danışırsa, sən də HƏMİN DİLDƏ cavab ver.

Azərbaycan dilində danışarkən: rəsmi ədəbi dil, "Siz" müraciəti, sözü tam tələffüz et.

VƏZİFƏ: Menyunu izah et, qiymətləri de, tövsiyə ver. Yalnız restoran mövzusu.

CAVAB FORMATI: Qısa, mehriban. 1-2 cümlə. Heç bir markdown, heç bir siyahı.

RESTORAN: Green Cafe, Şıxov, Green City Resort. Saat 09:00-23:00.

SALAMLAMA: Sessiya başlayanda dərhal qısa Azərbaycanca salamla, məsələn: "Salam, Green Cafe-yə xoş gəldiniz! Nə arzulayırsınız?"

VACİB — SİFARİŞ FUNKSİYALARI: Aşağıdakı menyuda hər yeməyin yanında [id:N] rəqəmi var. Qonaq bir yemək sifariş etmək, əlavə etmək, artırmaq, silmək və ya azaltmaq istədikdə, HƏMİŞƏ uyğun funksiyanı çağır:
• add_to_order(item_id, quantity) — sifarişə əlavə etmək üçün
• remove_from_order(item_id, quantity) — sifarişdən silmək və ya azaltmaq üçün
Miqdar deyilməyibsə, 1 istifadə et. Funksiyanı çağırmadan HEÇ VAXT "əlavə etdim", "sifarişə əlavə olundu" və ya bənzər bir şey demə — funksiya sifarişi DƏYİŞDİRƏN yeganə vasitədir, sözlə demək kifayət etmir. Funksiyanı çağırdıqdan sonra qonağa öz dilində qısa şəkildə şifahi təsdiq et.

MENYU — bütün qiymətləri və id-ləri bil, soruşanda dəqiq cavab ver:
${MENU_TEXT}

Items already confirmed (sent to kitchen) cannot be removed — politely explain this and suggest calling the waiter for changes.`;

// ─── Quick reply chips (3 languages) ─────────────────────────────────────────

export const QUICK_MESSAGES = [
  "Bu gün çox acam 🍽️",
  "Yüngül bir şey istəyirəm",
  "Büdcəm 10₼-dir",
  "Что посоветуете?",
  "What's popular here?",
];

// ─── Order command tag parsing ────────────────────────────────────────────────

const VALID_ITEM_IDS = new Set(
  menuData.flatMap((category) => category.items.map((item) => item.id))
);

const ORDER_TAG_REGEX =
  /\[\s*ORDER_(ADD|REMOVE)\s*:\s*(\d+)\s*(?:,\s*(\d+))?\s*\]/gi;

// Phrases the model sometimes uses to claim an item was added/removed
// without emitting the tag — used as a frontend safety net.
const ADD_CLAIM_REGEX =
  /əlavə edildi|əlavə olundu|добавил|добавлено|added to your order/i;

function parseOrderCommands(text: string): {
  commands: OrderCommand[];
  cleanedText: string;
} {
  const commands: OrderCommand[] = [];

  const cleanedText = text
    .replace(ORDER_TAG_REGEX, (_match, action: string, id: string, qty?: string) => {
      const parsedId = Number(id);
      if (VALID_ITEM_IDS.has(parsedId)) {
        commands.push({
          type: action.toUpperCase() === "ADD" ? "add" : "remove",
          id: parsedId,
          quantity: qty ? Number(qty) : 1,
        });
      }
      return "";
    })
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  return { commands, cleanedText };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const INITIAL_GREETING =
  "Salam! Green Cafe-yə xoş gəlmisiniz. Mən sizin AI ofisiantınızam — menyu, qiymətlər, tövsiyələr barədə kömək edə bilərəm. Hansı dildə rahat danışırsınızsa, həmin dildə yazın.\n\nЗдравствуйте! Я AI-официант Green Cafe. Пишите на любом языке.\n\nHello! I'm your AI waiter at Green Cafe. Write in any language you prefer.";

export interface UseChatOptions {
  onOrderCommands?: (commands: OrderCommand[]) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { onOrderCommands } = options;
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: INITIAL_GREETING,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
            // Send the assistant's own past tag usage back so the model
            // stays consistent with how it behaved earlier in the chat.
            content: m.role === "assistant" ? m.raw ?? m.content : m.content,
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

      const { commands, cleanedText } = parseOrderCommands(assistantText);
      let displayText = cleanedText || assistantText;

      // Safety net: the model claimed a change but emitted no tag — surface
      // the failure instead of silently doing nothing.
      if (commands.length === 0 && ADD_CLAIM_REGEX.test(displayText)) {
        displayText = `${displayText}\n\n${t("order.addFailedHint")}`;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: displayText, raw: assistantText },
      ]);

      if (commands.length > 0) {
        onOrderCommands?.(commands);
      }
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

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    messagesEndRef,
  };
}
