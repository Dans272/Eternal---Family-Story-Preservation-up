// api/gemini.ts — Vercel serverless function
// Runs exclusively on the server; GEMINI_API_KEY never reaches the browser.
//
// POST /api/gemini
// Body: GeminiRequest (discriminated union on `action`)
// Response: GeminiResponse | ErrorResponse
//
// All three Gemini call-sites from the original client code are handled here:
//   "summary"   — narrative profile biography   (gemini-2.0-flash)
//   "research"  — grounded historical context   (gemini-2.5-pro-preview-05-06)
//   "portrait"  — image generation              (gemini-2.0-flash-preview-image-generation)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// ── Request / response shapes (kept in sync with services/gemini.ts) ─────────

type GeminiRequest =
  | { action: 'summary';   prompt: string }
  | { action: 'research';  prompt: string }
  | { action: 'portrait';  prompt: string };

type GeminiResponse =
  | { text: string }                              // summary / research
  | { imageBase64: string }                       // portrait
  | { text: string; sources: GroundingSource[] }; // research with grounding

interface GroundingSource {
  web?: { uri: string; title: string };
}

interface ErrorResponse {
  error: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

const VALID_ACTIONS = new Set(['summary', 'research', 'portrait']);
const MAX_PROMPT_LENGTH = 8_000; // characters — well under Gemini input limits

function validate(body: unknown): GeminiRequest {
  if (!body || typeof body !== 'object') {
    throw new RequestError(400, 'Request body must be a JSON object.');
  }

  const { action, prompt } = body as Record<string, unknown>;

  if (typeof action !== 'string' || !VALID_ACTIONS.has(action)) {
    throw new RequestError(
      400,
      `"action" must be one of: ${[...VALID_ACTIONS].join(', ')}.`
    );
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new RequestError(400, '"prompt" must be a non-empty string.');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new RequestError(
      400,
      `"prompt" exceeds the maximum length of ${MAX_PROMPT_LENGTH} characters.`
    );
  }

  return { action, prompt } as GeminiRequest;
}

class RequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

// ── Gemini helpers ────────────────────────────────────────────────────────────

async function runSummary(ai: GoogleGenAI, prompt: string): Promise<{ text: string }> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return { text: response.text ?? 'Summary unavailable.' };
}

async function runResearch(
  ai: GoogleGenAI,
  prompt: string
): Promise<{ text: string; sources: GroundingSource[] }> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro-preview-05-06',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const sources: GroundingSource[] =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  return {
    text: response.text ?? 'Historical research unavailable.',
    sources,
  };
}

async function runPortrait(
  ai: GoogleGenAI,
  prompt: string
): Promise<{ imageBase64: string }> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: [{ parts: [{ text: prompt }] }],
  });

  const candidates = response.candidates ?? [];
  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return { imageBase64: part.inlineData.data };
      }
    }
  }

  throw new RequestError(502, 'Gemini did not return an image.');
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
// Extracted from the handler body so TypeScript can prove the return type is
// always assigned. Each branch returns directly, eliminating the
// "Variable 'result' used before assigned" risk from a bare `let result`.

async function dispatch(ai: GoogleGenAI, request: GeminiRequest): Promise<GeminiResponse> {
  switch (request.action) {
    case 'summary':
      return runSummary(ai, request.prompt);
    case 'research':
      return runResearch(ai, request.prompt);
    case 'portrait':
      return runPortrait(ai, request.prompt);
    default: {
      // TypeScript exhaustiveness guard — should never be reached because
      // validate() only allows the three known actions.
      const _exhaustive: never = request;
      throw new RequestError(400, `Unknown action: ${(_exhaustive as any).action}`);
    }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only accept POST.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' } satisfies ErrorResponse);
    return;
  }

  // Guard: key must exist at runtime (set in Vercel dashboard / .env.local).
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[/api/gemini] GEMINI_API_KEY is not set.');
    res.status(500).json({
      error: 'Server misconfiguration: AI service is unavailable.',
    } satisfies ErrorResponse);
    return;
  }

  let request: GeminiRequest;
  try {
    request = validate(req.body);
  } catch (err) {
    const { status, message } =
      err instanceof RequestError ? err : { status: 400, message: String(err) };
    res.status(status).json({ error: message } satisfies ErrorResponse);
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await dispatch(ai, request);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof RequestError) {
      res.status(err.status).json({ error: err.message } satisfies ErrorResponse);
      return;
    }

    // Log the real error server-side but don't leak internals to the client.
    console.error('[/api/gemini] Gemini API error:', err);
    res.status(502).json({
      error: 'The AI service returned an error. Please try again.',
    } satisfies ErrorResponse);
  }
}
