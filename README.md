# Green Cafe — AI Waiter (Süni İntellekt Ofisiant)

Restoran üçün AI ofisiant sistemi. İki rejim var:
1. **Yazılı çat** — müştəri mesaj yazır, AI cavab verir (mətn + istəyə görə səs).
2. **Canlı səsli danışıq** — müştəri telefon düyməsinə basıb AI ilə real vaxtda, ChatGPT Voice Mode kimi danışır.

## Texnologiyalar
- React + Vite + TypeScript + Tailwind
- **Yazılı çat:** OpenRouter (Gemini 2.5 Flash-Lite), Groq Whisper (səsdən mətnə)
- **Canlı səs:** Gemini Live API (`@google/genai` SDK) — səs → AI → səs, barge-in dəstəyi ilə
- Vercel serverless funksiyaları (`/api`)

---

## 1. Lazım olan API açarları

Üç açar lazımdır. Hamısı Vercel-də Environment Variables kimi əlavə olunur:

| Açar | Nə üçün | Haradan alınır |
|------|---------|----------------|
| `GEMINI_API_KEY` | Canlı səs (Live API) + TTS | https://aistudio.google.com/apikey |
| `VITE_OPENROUTER_API_KEY` | Yazılı çatın AI cavabları | https://openrouter.ai/keys |
| `VITE_GROQ_API_KEY` | Səsdən mətnə (yazılı çatdakı mikrofon) | https://console.groq.com/keys |

> **Qeyd:** `GEMINI_API_KEY` brauzerə getmir — yalnız serverdə qalır, təhlükəsizdir. `VITE_` ilə başlayanlar brauzerdə işlədilir (bu, OpenRouter/Groq üçün normaldır).

### Açarları necə almaq

**GEMINI_API_KEY:**
1. https://aistudio.google.com/apikey ünvanına get
2. "Create API key" düyməsinə bas
3. Açarı kopyala

**VITE_OPENROUTER_API_KEY:**
1. https://openrouter.ai/keys ünvanına get
2. "Create Key" → kopyala

**VITE_GROQ_API_KEY:**
1. https://console.groq.com/keys ünvanına get
2. "Create API Key" → kopyala

---

## 2. Lokal işə salmaq

```bash
npm install
```

`.env` faylı yarat (`.env.example`-i nümunə götür) və açarları yaz:

```
VITE_OPENROUTER_API_KEY=sənin_açarın
VITE_GROQ_API_KEY=sənin_açarın
GEMINI_API_KEY=sənin_açarın
```

Sonra:

```bash
npm run dev
```

> **Vacib:** Sadə `npm run dev` ilə **canlı səs işləməyəcək**, çünki o, `/api/live-token` serverless funksiyasına ehtiyac duyur. Canlı səsi lokal sınamaq üçün Vercel CLI lazımdır:
> ```bash
> npm i -g vercel
> vercel dev
> ```
> Yazılı çat isə sadə `npm run dev` ilə də işləyir.

---

## 3. Vercel-ə deploy

1. Layihəni GitHub-a push et (aşağıdakı addımlara bax).
2. https://vercel.com → "Add New Project" → GitHub repo-nu seç.
3. **Environment Variables** bölməsində üç açarı əlavə et:
   - `GEMINI_API_KEY`
   - `VITE_OPENROUTER_API_KEY`
   - `VITE_GROQ_API_KEY`
4. "Deploy" düyməsinə bas.

`vercel.json` artıq hazırdır — `api/` qovluğundakı funksiyalar avtomatik serverless endpoint olur.

---

## 4. GitHub-a push

İlk dəfə (repo hələ yoxdursa):
```bash
git init
git add .
git commit -m "AI Waiter with Gemini Live voice"
git branch -M main
git remote add origin https://github.com/İSTİFADƏÇİ/REPO.git
git push -u origin main
```

Sonrakı dəyişikliklərdə:
```bash
git add .
git commit -m "dəyişiklik təsviri"
git push
```

> **Diqqət:** `.env` faylı `.gitignore`-dadır, GitHub-a getməyəcək (açarların təhlükəsizliyi üçün). Açarları yalnız Vercel-də əlavə et.

---

## 5. Necə test etmək (addım-addım)

1. Deploy bitəndən sonra saytı aç.
2. Sağ aşağıda çat düyməsinə bas.
3. **Yazılı çatı sına:** mesaj yaz (məs. "Acam, nə tövsiyə edərsən?") → AI cavab verməlidir.
4. **Canlı səsi sına:** çat başlığındakı **telefon ikonuna** bas.
   - Mikrofon icazəsi istəyəcək → "Allow" de.
   - "Dinləyir..." statusu görünməlidir.
   - Danış (Azərbaycanca, rusca və ya ingiliscə) → AI Azərbaycanca səslə cavab verməlidir.
   - AI danışarkən sözünü kəs (barge-in) → səs dayanmalı, səni dinləməyə başlamalıdır.
   - Bitirmək üçün qırmızı telefon düyməsinə bas.

### Problem olsa
- **"Token creation failed"** → `GEMINI_API_KEY` Vercel-də düzgün əlavə olunmayıb, ya da Live API açarın üçün əlçatan deyil.
- **404 /api/live-token** → deploy tam bitməyib, ya da `api/live-token.ts` GitHub-a getməyib.
- **Səs gəlmir, amma xəta yox** → `gemini-2.5-flash-native-audio-preview-09-2025` preview modeldir, gündəlik limiti ola bilər (429). Bu, kod xətası deyil, kvotadır.

---

## Qovluq strukturu

```
api/
  live-token.ts   → Gemini Live üçün təhlükəsiz ephemeral token verir
  tts.ts          → Yazılı çat üçün mətndən səsə (Gemini TTS)
src/Components/Chatbot/
  Chatbot.tsx     → əsas UI (yazılı çat + canlı səs overlay)
  useLiveVoice.ts → canlı səs məntiqi (WebSocket, mikrofon, audio playback, barge-in)
  pcmToWav.ts     → TTS audio çevrilməsi
vercel.json       → Vercel deploy konfiqurasiyası
```
