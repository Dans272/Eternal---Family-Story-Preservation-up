// services/gemini.ts
// All Gemini calls now proxy through /api/gemini (a Vercel serverless function).
// No @google/genai import, no API key, no process.env in this file.

import type { Profile } from '../types';
import { formatEventSentence } from '../utils/formatters';

// ── Shared transport ──────────────────────────────────────────────────────────

const ENDPOINT = '/api/gemini';

interface SummaryResponse  { text: string }
interface ResearchResponse { text: string; sources: GroundingSource[] }
interface PortraitResponse { imageBase64: string }
interface ErrorResponse    { error: string }

interface GroundingSource {
  web?: { uri: string; title: string };
}

type ApiAction = 'summary' | 'research' | 'portrait';

async function callGemini(action: ApiAction, prompt: string): Promise<Response> {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, prompt }),
  });
}

/** Parse the response, throwing a human-readable message on failure. */
async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json() as T | ErrorResponse;
  if (!res.ok) {
    const msg = (body as ErrorResponse).error ?? `Server error ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

// ── Public API (same signatures as the original service) ─────────────────────

/**
 * Generate a narrative life summary for a profile.
 * Model: gemini-2.0-flash (server-side)
 */
export async function generateAiProfileSummary(profile: Profile): Promise<string> {
  const events = profile.timeline
    .map((ev) => formatEventSentence(profile.name, ev))
    .join('\n');
  const memories = profile.memories.map((m) => m.content).join('\n');

  const prompt = `
Generate a respectful, high-quality, narrative life summary for ${profile.name} (born ${profile.birthYear}).
Use the following timeline events and family stories to weave a cohesive biographical sketch.

Timeline:
${events}

Family Stories:
${memories}

Instructions:
- Focus on the impact of their life.
- Keep it under 250 words.
- Maintain an archival, historical, and elegant tone.
`.trim();

  try {
    const res = await callGemini('summary', prompt);
    const data = await parseOrThrow<SummaryResponse>(res);
    return data.text;
  } catch (err) {
    console.error('[gemini] generateAiProfileSummary:', err);
    return 'Failed to generate AI summary.';
  }
}

/**
 * Fetch grounded historical context for a profile's life period and locations.
 * Model: gemini-2.5-pro-preview-05-06 with Google Search grounding (server-side)
 */
export async function getHistoricalContext(
  profile: Profile
): Promise<{ text: string; sources: GroundingSource[] }> {
  const lifePeriod = `${profile.birthYear} to ${profile.deathYear || 'the present'}`;
  const locations = Array.from(
    new Set(profile.timeline.map((e) => e.place).filter(Boolean))
  ).join(', ');

  const prompt = `Provide a comprehensive historical deep-dive into the era and specific locations inhabited by ${profile.name} during their life from ${lifePeriod}.
The primary locations were: ${locations}.

Research and describe:
1. Specific local history and atmosphere of ${locations} during these decades.
2. Major global events (wars, movements, economic shifts) that significantly altered their daily world.
3. Technological innovations or cultural changes that a person living in ${locations} would have witnessed.

Format this as a "Historical Narrative" for a family archive. Be specific, evocative, and archival in tone.`.trim();

  try {
    const res = await callGemini('research', prompt);
    const data = await parseOrThrow<ResearchResponse>(res);
    return { text: data.text, sources: data.sources ?? [] };
  } catch (err) {
    console.error('[gemini] getHistoricalContext:', err);
    return {
      text: 'Our digital archives could not be reached. Please check your connection and try again.',
      sources: [],
    };
  }
}

/**
 * Generate an AI portrait image for a profile.
 * Model: gemini-2.0-flash-preview-image-generation (server-side)
 * Returns a data URL string ready to assign to profile.imageUrl.
 * Throws on failure so the caller (App.tsx) can catch and show a toast.
 */
export async function generateAiPortrait(profile: Profile): Promise<string> {
  const prompt = `A period-accurate, elegant studio portrait of a person named ${profile.name} born in ${profile.birthYear}. Style: historical photographic daguerreotype or charcoal sketch, highly detailed, archival museum quality.`;

  const res = await callGemini('portrait', prompt);
  const data = await parseOrThrow<PortraitResponse>(res);
  return `data:image/png;base64,${data.imageBase64}`;
}
