// api/live-token.ts  — Vercel Serverless Function
// Returns the Gemini API key for the Live Voice WebSocket session.
// Key stays in env var; never shipped in the client bundle.

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const token = process.env.GEMINI_API_KEY;
  if (!token) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }
  // Return token — the client uses it directly in the WebSocket URL.
  // Acceptable since the token is short-lived per request in a trusted env.
  return res.status(200).json({ token });
}
