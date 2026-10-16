import { NextResponse } from "next/server";

// Cache the rate in-memory for 1 hour
let cachedRate: { rate: number; timestamp: number; provider: string } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();

  // Return memory cache if still valid
  if (cachedRate && now - cachedRate.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      rate: cachedRate.rate,
      base: "USD",
      target: "IDR",
      lastUpdated: new Date(cachedRate.timestamp).toISOString(),
      provider: cachedRate.provider,
      isFallback: false,
      cached: true,
    });
  }

  // 1. Try primary provider: open.er-api.com
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
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

        return NextResponse.json({
          success: true,
          rate: cachedRate.rate,
          base: "USD",
          target: "IDR",
          lastUpdated: new Date(now).toISOString(),
          provider: cachedRate.provider,
          isFallback: false,
          cached: false,
        });
      }
    }
  } catch (err) {
    console.warn("Primary exchange rate API failed, trying fallback:", err);
  }

  // 2. Try fallback provider: exchangerate-api.com v4
  try {
    const fallbackRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const idrRate = data?.rates?.IDR;
      if (typeof idrRate === "number" && idrRate > 10000 && idrRate < 30000) {
        cachedRate = {
          rate: Math.round(idrRate),
          timestamp: now,
          provider: "exchangerate-api.com",
        };

        return NextResponse.json({
          success: true,
          rate: cachedRate.rate,
          base: "USD",
          target: "IDR",
          lastUpdated: new Date(now).toISOString(),
          provider: cachedRate.provider,
          isFallback: false,
          cached: false,
        });
      }
    }
  } catch (err) {
    console.warn("Fallback exchange rate API failed:", err);
  }

  // 3. Fallback to cached rate if available, otherwise sensible default
  const fallbackValue = cachedRate?.rate || 16250;
  return NextResponse.json({
    success: true,
    rate: fallbackValue,
    base: "USD",
    target: "IDR",
    lastUpdated: new Date(now).toISOString(),
    provider: "offline-fallback",
    isFallback: true,
    cached: false,
  });
}
