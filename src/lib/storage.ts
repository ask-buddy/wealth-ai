import { WealthPortfolio } from "@/types/wealth";

const STORAGE_KEY = "angelwealth_portfolio_data_v3";

export function savePortfolioToStorage(portfolio: WealthPortfolio): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch (e) {
    console.warn("localStorage quota exceeded, storing stripped portfolio:", e);
    try {
      const stripped = { ...portfolio, documentPreviews: undefined };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch (inner) {
      console.error("Failed to save portfolio to localStorage:", inner);
    }
  }
}

export function loadPortfolioFromStorage(): WealthPortfolio | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as WealthPortfolio;
  } catch (e) {
    console.error("Failed to load portfolio from localStorage:", e);
    return null;
  }
}

export function clearPortfolioStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear localStorage:", e);
  }
}
