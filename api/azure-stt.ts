import type { VercelRequest, VercelResponse } from "@vercel/node";

// Azure Speech "fast transcription" — audio faylını mətnə çevirir.
// Dil təyini yalnız AZ / RU / EN ilə məhdudlaşır, ona görə ərəbcə kimi səhv dil çıxmır.
// Key yalnız serverdə qalır (AZURE_SPEECH_KEY), brauzerə getmir.
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    res.status(500).json({ error: "Server is missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION" });
    return;
  }

  try {
    // Gələn audio-nu (binary) tam oxu
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Azure fast transcription multipart/form-data tələb edir
    const boundary = "----AzureFormBoundary" + Math.random().toString(36).slice(2);
    const definition = JSON.stringify({
      // Yalnız Azərbaycan dili — səsli mesaj həmişə AZ kimi tanınır,
      // ruscaya/ərəbcəyə keçmir (restoran müştəriləri səslə əsasən AZ danışır)
      locales: ["az-AZ"],
      profanityFilterMode: "None",
    });

    const pre =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="audio"; filename="audio.webm"\r\n` +
      `Content-Type: audio/webm\r\n\r\n`;
    const mid =
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="definition"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      definition +
      `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([Buffer.from(pre, "utf8"), audioBuffer, Buffer.from(mid, "utf8")]);

    const url = `https://${region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;

    const azureRes = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!azureRes.ok) {
      const errText = await azureRes.text();
      res.status(azureRes.status).json({ error: "Azure STT failed", details: errText });
      return;
    }

    const data = await azureRes.json();
    // Fast transcription cavabı: combinedPhrases[0].text
    const text =
      data?.combinedPhrases?.[0]?.text ??
      data?.combinedPhrases?.map((p: { text: string }) => p.text).join(" ") ??
      "";

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: "Transcription failed", details: String(err) });
  }
}
