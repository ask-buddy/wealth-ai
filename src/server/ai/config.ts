import { GoogleGenAI } from "@google/genai";

/**
 * 9router & Gemini AI Central Configuration
 * All connection and model settings are centralized in this single module.
 * Can be configured via environment variables or overridden at runtime.
 */

// 1. Connection & Endpoint Defaults
export const DEFAULT_9ROUTER_URL =
  "https://marion-mats-responsibilities-express.trycloudflare.com/v1";
export const DEFAULT_API_KEY = "sk-ce72aa2310c36158-dsg15r-2de4b7b2";

// 2. Model Defaults
export const DEFAULT_MODEL = "FireAce";
export const DEFAULT_FALLBACK_MODEL = "gemini/gemini-3.8-flash-medium";

// Helper to guarantee the base URL ends with /v1
export function ensureV1Endpoint(url: string): string {
  const clean = (url || "").trim().replace(/\/+$/, "");
  if (!clean) return DEFAULT_9ROUTER_URL;
  if (clean.endsWith("/chat/completions")) {
    return clean.replace(/\/chat\/completions$/, "");
  }
  return clean.endsWith("/v1") ? clean : `${clean}/v1`;
}

// 3. Active Resolved Configuration
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || DEFAULT_API_KEY;
export const GEMINI_BASE_URL = ensureV1Endpoint(
  process.env.GEMINI_BASE_URL || DEFAULT_9ROUTER_URL,
);
export const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL;
export const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;

// 4. Candidate Models (Primary model first, followed by optional fallback if distinct)
export const GEMINI_CANDIDATE_MODELS: string[] = [
  GEMINI_MODEL,
  ...(GEMINI_FALLBACK_MODEL && GEMINI_FALLBACK_MODEL !== GEMINI_MODEL
    ? [GEMINI_FALLBACK_MODEL]
    : []),
];

// Normalize base URL for GoogleGenAI SDK (strip trailing /v1 or trailing slash if present)
const normalizedBaseUrl = GEMINI_BASE_URL.replace(/\/v1\/?$/, "").replace(
  /\/+$/,
  "",
);

// 5. Google Gen AI SDK instance
export const genAI = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    baseUrl: normalizedBaseUrl,
  },
});
