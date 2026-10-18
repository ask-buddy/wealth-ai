export interface ExchangeRateResult {
  success: boolean;
  rate: number;
  base: "USD";
  target: "IDR";
  lastUpdated: string;
  provider: string;
  isFallback: boolean;
  cached: boolean;
}

// In-memory cache for 1 hour
let cachedRate: { rate: number; timestamp: number; provider: string } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Service to fetch live real-time USD/IDR exchange rate.
 * Decoupled from Next.js response objects.
 */
export async function getLiveExchangeRate(): Promise<ExchangeRateResult> {
  const now = Date.now();

  // Return memory cache if still valid
  if (cachedRate && now - cachedRate.timestamp < CACHE_TTL_MS) {
    return {
      success: true,
      rate: cachedRate.rate,
      base: "USD",
      target: "IDR",
      lastUpdated: new Date(cachedRate.timestamp).toISOString(),
      provider: cachedRate.provider,
      isFallback: false,
      cached: true,
    };
  }

  // 1. Try primary provider: open.er-api.com
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const idrRate = data?.rates?.IDR;
      if (typeof idrRate === "number" && idrRate > 10000 && idrRate < 30000) {
        cachedRate = {
          rate: Math.round(idrRate),
          timestamp: now,
          provider: "open.er-api.com",
        };

        return {
          success: true,
          rate: cachedRate.rate,
          base: "USD",
          target: "IDR",
          lastUpdated: new Date(now).toISOString(),
          provider: cachedRate.provider,
          isFallback: false,
          cached: false,
        };
      }
    }
  } catch (err) {
    console.warn("[Exchange Rate Service] Primary API failed, trying fallback:", err);
  }

  // 2. Try fallback provider: exchangerate-api.com v4
  try {
    const fallbackRes = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const idrRate = data?.rates?.IDR;
      if (typeof idrRate === "number" && idrRate > 10000 && idrRate < 30000) {
        cachedRate = {
          rate: Math.round(idrRate),
          timestamp: now,
          provider: "exchangerate-api.com",
        };

        return {
          success: true,
          rate: cachedRate.rate,
          base: "USD",
          target: "IDR",
          lastUpdated: new Date(now).toISOString(),
          provider: cachedRate.provider,
          isFallback: false,
          cached: false,
        };
      }
    }
  } catch (err) {
    console.warn("[Exchange Rate Service] Fallback API failed:", err);
  }

  // 3. Fallback to cached rate if available, otherwise sensible default
  const fallbackValue = cachedRate?.rate || 16250;
  return {
    success: true,
    rate: fallbackValue,
    base: "USD",
    target: "IDR",
    lastUpdated: new Date(now).toISOString(),
    provider: "offline-fallback",
    isFallback: true,
    cached: false,
  };
}
