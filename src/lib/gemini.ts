import { GoogleGenAI } from "@google/genai";

const rawApiKey =
  process.env.GEMINI_API_KEY || "sk-ce72aa2310c36158-dsg15r-2de4b7b2";
const rawBaseUrl = process.env.GEMINI_BASE_URL || "http://localhost:2208/v1";

// Normalize base URL for GoogleGenAI SDK (strip trailing /v1 or trailing slash if present)
const normalizedBaseUrl = rawBaseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");

export const genAI = new GoogleGenAI({
  apiKey: rawApiKey,
  httpOptions: {
    baseUrl: normalizedBaseUrl,
    headers: {
      Authorization: `Bearer ${rawApiKey}`,
      "x-goog-api-key": rawApiKey,
    },
  },
});

export const GEMINI_BASE_URL = rawBaseUrl;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
