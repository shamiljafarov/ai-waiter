// api/chat.ts  — Vercel Serverless Function
// Proxies chat messages to OpenRouter, keeping the API key server-side.

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  systemPrompt: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, systemPrompt } = req.body as RequestBody;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter recommends these headers
        "HTTP-Referer": "https://greencafe.az",
        "X-Title": "Green Cafe AI Waiter",
      },
      body: JSON.stringify({
        // Gemini 2.5 Flash has excellent Azerbaijani + multilingual support
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return res.status(502).json({ error: "Upstream API error" });
    }

    const data = await response.json();
    const content: string =
      data.choices?.[0]?.message?.content ?? "Bağışlayın, cavab verə bilmədim.";

    return res.status(200).json({ content });
  } catch (err) {
    console.error("Chat handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
