# AI Waiter — Green Cafe

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (via @tailwindcss/vite, CSS-first config in src/index.css)
- i18next (AZ/EN/RU), locales in src/Components/i18n/locales/
- Vercel serverless functions in /api (chat.ts, azure-stt.ts, live-token.ts) — DO NOT MODIFY
- Deployed on Vercel; /api routes do not work in local `npm run dev` — this is expected

## Design system (DO NOT CHANGE COLORS)
- Background: #f6f6f2 (light warm off-white)
- Text: stone-900 / stone-600 / stone-500
- Accent gold: #9f7d1c (prices, active states), #f3d46b (badges)
- Cards: white, rounded-2xl
- Keep this exact palette everywhere. New screens must reuse these tokens.
- Typography: keep existing font stack.

## Architecture (target)
- Screen-based navigation via React state (NO react-router):
  type Screen = "landing" | "menu" | "aiwaiter" | "checkout"
- Global order state via React Context (OrderContext): items with quantity,
  note, derived subtotal, 10% service fee, total, total kcal.
- Existing Chatbot.tsx contains chat + STT + live voice logic. NEVER rewrite
  its API/voice logic (sendMessage, recording, useLiveVoice usage). Only
  extract/move UI when instructed.

## Rules
- All user-facing strings go through i18next — add keys to az.json, en.json,
  ru.json simultaneously. AZ is the source of truth.
- Mobile-first: every new screen needs a mobile (<640px) and desktop (lg+) layout.
- Components live in src/Components/<Name>/<Name>.tsx
- Do not touch /api, useLiveVoice.ts, vercel.json, or system prompts unless
  the task explicitly says so.
