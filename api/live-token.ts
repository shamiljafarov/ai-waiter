import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Modality } from "@google/genai";

// Live API üçün istifadə olunan model — token bu modelə "kilidlənir"
const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

// Ephemeral token-lər brauzerin Gemini Live API-yə birbaşa, təhlükəsiz qoşulması üçündür.
// Əsl GEMINI_API_KEY yalnız serverdə qalır; brauzerə yalnız 30 dəqiqəlik token gedir.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });

    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    res.status(200).json({ token: token.name });
  } catch (err) {
    res.status(500).json({
      error: "Token creation failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
