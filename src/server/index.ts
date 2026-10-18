/**
 * AngelWealth Backend Core Module
 * 
 * Fully decoupled business logic and AI services.
 * Ready to be imported directly into:
 * - Next.js Route Handlers
 * - Mac App (Electron / Tauri / React Native macOS)
 * - Node.js CLI / Microservices
 */

export * from "./services/analysis.service";
export * from "./services/locate-asset.service";
export * from "./services/exchange-rate.service";
export * from "./ai/config";
export * from "./ai/client";
export * from "./ai/prompts";
