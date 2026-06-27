// api/gemini-stt.ts — Vercel Serverless Function
// Transcribes audio using Gemini (primary) with Azure STT as fallback.
// Gemini handles colloquial Azerbaijani (slang, accent, incomplete words) much better.

export async function POST(req: Request) {
  try {
    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      if (!audioFile) return jsonResponse({ error: "No audio file" }, 400);
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      mimeType = audioFile.type || mimeType;
    } else {
      audioBuffer = Buffer.from(await req.arrayBuffer());
      if (contentType && !contentType.includes("octet-stream")) {
        mimeType = contentType.split(";")[0].trim();
      }
    }

    // ── 1. Try Gemini first ────────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const base64Audio = audioBuffer.toString("base64");

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Audio,
                      },
                    },
                    {
                      text: `Listen to this audio and transcribe it into natural, standard Azerbaijani text.

Rules:
- The speaker may use colloquial Azerbaijani, Russian-Azerbaijani mix, or accented speech — normalize it all into correct literary Azerbaijani.
- Fix phonetic errors: "işmək" → "içmək", "getmey" → "getmək", "nətərsən" → "necəsən", "bişey" → "bir şey", "qəşəy" → "gözəl", etc.
- Replace Russian food/drink words with Azerbaijani: "supu" → "şorbası", "kotleti" → "kotlet", "salat" → "salat" (keep if same), "çay" stays "çay".
- If the speaker mixes Russian words into Azerbaijani sentences, translate those Russian words to Azerbaijani and write the whole sentence in Azerbaijani.
- If the speaker speaks fully in Russian, transcribe in Russian (standard).
- If the speaker speaks fully in English, transcribe in English (standard).
- Return ONLY the final clean transcribed text. No explanations, no quotes, no extra text.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text: string =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

          if (text && text.length > 0) {
            console.log("[STT] Gemini success:", text);
            return jsonResponse({ text });
          }
        } else {
          const errText = await geminiRes.text();
          console.warn("[STT] Gemini failed:", geminiRes.status, errText);
        }
      } catch (e) {
        console.warn("[STT] Gemini error:", e);
      }
    }

    // ── 2. Fallback to Azure STT ───────────────────────────────────────────
    const azureKey = process.env.AZURE_STT_KEY;
    const azureRegion = process.env.AZURE_STT_REGION;

    if (!azureKey || !azureRegion) {
      return jsonResponse({ error: "No STT service configured" }, 500);
    }

    console.log("[STT] Falling back to Azure...");

    const url = `https://${azureRegion}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`;

    const definition = {
      locales: ["az-AZ", "ru-RU", "en-US"],
      profanityFilterMode: "None",
    };

    const body = new FormData();
    body.append(
      "audio",
      new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
      "audio.webm"
    );
    body.append("definition", JSON.stringify(definition));

    const azureRes = await fetch(url, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": azureKey },
      body,
    });

    if (!azureRes.ok) {
      const errText = await azureRes.text();
      console.error("[STT] Azure error:", azureRes.status, errText);
      return jsonResponse({ error: "Transcription failed" }, 500);
    }

    const result = await azureRes.json();
    const transcript =
      result?.combinedPhrases?.[0]?.text ||
      result?.phrases?.map((p: { text: string }) => p.text).join(" ") ||
      "";

    console.log("[STT] Azure success:", transcript);
    return jsonResponse({ text: transcript });
  } catch (error) {
    console.error("[STT] Unexpected error:", error);
    return jsonResponse({ error: "Transcription failed" }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}