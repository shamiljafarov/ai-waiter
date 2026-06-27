// Azerbaijani menu items + common restaurant/conversation words for phrase biasing
const AZ_PHRASE_LIST: string[] = [
  "salam", "necəsən", "necəsiz", "xahiş eliyirəm", "təşəkkür eliyirəm",
  "bəli", "xeyr", "zəhmət olmasa", "buyurun", "əlbətdə",
  "menyuya baxmax", "sifariş verməy", "hesab", "çek",
  "içgi", "içməy", "yeməy", "tort", "desert",
  "supu", "doğa", "düşbərə", "piti", "bozbaş",
  "göbələy supu", "qaymağlı göbələy supu",
  "qəlyanalaltı", "salat", "Çoban salatı", "Yunan salatı",
  "kəsmiyli", "pendir", "zeytun",
  "lülə kabab", "tava kabab", "tikə kabab", "şiş kabab", "toyuğ", "balığ",
  "küfdə", "dolma", "badımcan dolması", "bibər dolması",
  "plov", "şəkərri plov", "qaynana barmağı",
  "ləvəngi", "qutab", "ətdi qutab",
  "lavaş", "çörəy", "düyü", "kartof",
  "göyərti", "soğan", "pomidor", "xiyar",
  "çay", "qəhvə", "ayran", "şirə", "limonat",
  "su", "isdi su", "soyuğ su",
  "paxlava", "şəkərbura", "halva", "dondurma",
  "neçiyədi", "nə qədər", "bir", "iki", "üç", "dörd", "beş",
  "ədəd", "porsiya", "böyüy", "kiçiy",
];

export async function POST(req: Request) {
  try {
    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      if (!audioFile) {
        return jsonResponse({ error: "No audio file provided" }, 400);
      }
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      mimeType = audioFile.type || mimeType;
    } else {
      audioBuffer = Buffer.from(await req.arrayBuffer());
      if (contentType && !contentType.includes("octet-stream")) {
        mimeType = contentType.split(";")[0].trim();
      }
    }

    // FIX: correct env variable names matching Vercel settings
    const azureKey = process.env.AZURE_STT_KEY;
    const azureRegion = process.env.AZURE_STT_REGION;

    if (!azureKey || !azureRegion) {
      return jsonResponse({ error: "Azure Speech credentials not configured" }, 500);
    }

    // FIX: support AZ + RU + EN — send all three locales
    const url = `https://${azureRegion}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`;

    const definition = {
      locales: ["az-AZ", "ru-RU", "en-US"],
      profanityFilterMode: "None",
      phraseList: {
        phrases: AZ_PHRASE_LIST,
        biasWeight: 1.5,
      },
    };

    const body = new FormData();
    body.append("audio", new Blob([new Uint8Array(audioBuffer)], { type: mimeType }), "audio.webm");
    body.append("definition", JSON.stringify(definition));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": azureKey },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure STT error:", response.status, errorText);

      if (response.status === 400 || response.status === 404) {
        return await fallbackTranscribe(audioBuffer, mimeType, azureKey, azureRegion);
      }

      return jsonResponse({ error: `Azure STT failed: ${response.status}` }, 500);
    }

    const result = await response.json();
    const transcript =
      result?.combinedPhrases?.[0]?.text ||
      result?.phrases?.map((p: { text: string }) => p.text).join(" ") ||
      "";

    return jsonResponse({ text: transcript });
  } catch (error) {
    console.error("STT error:", error);
    return jsonResponse({ error: "Transcription failed" }, 500);
  }
}

async function fallbackTranscribe(
  audioBuffer: Buffer,
  mimeType: string,
  azureKey: string,
  azureRegion: string
): Promise<Response> {
  const url = `https://${azureRegion}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;

  const definition = {
    locales: ["az-AZ", "ru-RU", "en-US"],
    profanityFilterMode: "None",
  };

  const body = new FormData();
  body.append("audio", new Blob([new Uint8Array(audioBuffer)], { type: mimeType }), "audio.webm");
  body.append("definition", JSON.stringify(definition));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": azureKey },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure STT fallback error:", response.status, errorText);
      return jsonResponse({ error: `Azure STT failed: ${response.status}` }, 500);
    }

    const result = await response.json();
    const transcript =
      result?.combinedPhrases?.[0]?.text ||
      result?.phrases?.map((p: { text: string }) => p.text).join(" ") ||
      "";

    return jsonResponse({ text: transcript });
  } catch (err) {
    console.error("Fallback STT error:", err);
    return jsonResponse({ error: "Transcription failed" }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
