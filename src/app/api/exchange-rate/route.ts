import { NextResponse } from "next/server";
import { getLiveExchangeRate } from "@/server";

/**
 * HTTP Adapter for Live Exchange Rate
 * Delegates logic to pure service in src/server
 */
export async function GET() {
  const result = await getLiveExchangeRate();
  return NextResponse.json(result);
}
