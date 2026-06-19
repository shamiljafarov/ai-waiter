import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const VOICE_NAME = "Kore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text } = req.body ?? {};

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing 'text' field" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  // Limit length to keep cost/latency predictable for a chat reply
  const safeText = text.slice(0, 2000);

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Aşağıdaki Azərbaycan dilindəki mətni təbii, dost münasibətli, restoran ofisiantı tonunda səsləndir:\n\n${safeText}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: VOICE_NAME },
              },
            },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      res.status(geminiResponse.status).json({ error: "Gemini TTS error", details: errText });
      return;
    }

    const data = await geminiResponse.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const audioBase64: string | undefined = part?.inlineData?.data;
    const mimeType: string = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";

    if (!audioBase64) {
      res.status(502).json({ error: "No audio returned from Gemini", details: data });
      return;
    }

    res.status(200).json({ audio: audioBase64, mimeType });
  } catch (err) {
    res.status(500).json({ error: "TTS request failed", details: String(err) });
  }
}