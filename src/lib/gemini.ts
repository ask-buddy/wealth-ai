import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

export const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const GEMINI_MODEL = "gemini-3.8-flash";
