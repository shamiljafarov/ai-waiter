// Azerbaijani menu items + common restaurant/conversation words for phrase biasing
const AZ_PHRASE_LIST: string[] = [
  // Common greetings / conversation
  "salam", "necəsən", "necəsiz", "xahiş eliyirəm", "təşəkkür eliyirəm",
  "bəli", "xeyr", "zəhmət olmasa", "buyurun", "əlbətdə",
  // Menu & ordering
  "menyuya baxmax", "sifariş verməy", "hesab", "çek",
  "içgi", "içməy", "yeməy", "tort", "desert",
  // Soups
  "supu", "doğa", "düşbərə", "piti", "bozbaş",
  "göbələy supu", "qaymağlı göbələy supu",
  // Salads / starters
  "qəlyanalaltı", "salat", "Çoban salatı", "Yunan salatı",
  "kəsmiyli", "pendir", "zeytun",
  // Mains
  "lülə kabab", "tava kabab", "tikə kabab", "şiş kabab", "toyuğ", "balığ",
  "küfdə", "dolma", "badımcan dolması", "bibər dolması",
  "plov", "şəkərri plov", "qaynana barmağı",
  "ləvəngi", "qutab", "ətdi qutab",
  // Sides / extras
  "lavaş", "çörəy", "düyü", "kartof",
  "göyərti", "soğan", "pomidor", "xiyar",
  // Drinks
  "çay", "qəhvə", "ayran", "şirə", "limonat",
  "su", "isdi su", "soyuğ su",
  // Desserts
  "paxlava", "şəkərbura", "halva", "dondurma",
  // Price / quantity
  "neçiyədi", "nə qədər", "bir", "iki", "üç", "dörd", "beş",
  "ədəd", "porsiya", "böyüy", "kiçiy",
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return jsonResponse({ error: "No audio file provided" }, 400);
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION;

    if (!azureKey || !azureRegion) {
      return jsonResponse(
        { error: "Azure Speech credentials not configured" },
        500
      );
    }

    // Use API version 2025-10-15 which supports phraseList biasing
    const url = `https://${azureRegion}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`;

    const definition = {
      locales: ["az-AZ"],
      profanityFilterMode: "None",
      phraseList: {
        phrases: AZ_PHRASE_LIST,
        // biasWeight: 1.0–2.0 range; 1.8 strongly favours listed phrases
        biasWeight: 1.8,
      },
    };

    const body = new FormData();
    body.append("audio", new Blob([audioBuffer], { type: audioFile.type }), "audio.webm");
    body.append("definition", JSON.stringify(definition));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure STT error:", response.status, errorText);

      // Fallback: retry with older API version if 2025-10-15 not supported in this region
      if (response.status === 400 || response.status === 404) {
        return await fallbackTranscribe(audioBuffer, audioFile.type, azureKey, azureRegion);
      }

      return jsonResponse(
        { error: `Azure STT failed: ${response.status}` },
        500
      );
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

// Fallback using older API version (without phraseList) if region doesn't support 2025-10-15
async function fallbackTranscribe(
  audioBuffer: Buffer,
  mimeType: string,
  azureKey: string,
  azureRegion: string
): Promise<Response> {
  const url = `https://${azureRegion}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;

  const definition = {
    locales: ["az-AZ"],
    profanityFilterMode: "None",
  };

  const body = new FormData();
  body.append("audio", new Blob([audioBuffer], { type: mimeType }), "audio.webm");
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
