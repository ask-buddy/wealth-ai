import { NextRequest, NextResponse } from "next/server";
import { analyzePortfolioDocuments } from "@/server";

export const maxDuration = 180; // Extended execution timeout for multimodal document audit (up to 3 minutes)

/**
 * HTTP Adapter for Document Analysis
 * Delegates all business logic to pure service in src/server
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files = body?.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Minimal satu dokumen diperlukan untuk dianalisis." },
        { status: 400 },
      );
    }

    const result = await analyzePortfolioDocuments(files);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Analyze Error:", error);

    const rawMsg = error?.message || "";
    let friendlyMessage = "Terjadi kendala saat menganalisis dokumen.";

    if (
      rawMsg.includes("530") ||
      rawMsg.toLowerCase().includes("cloudflare") ||
      rawMsg.toLowerCase().includes("tunnel error") ||
      rawMsg.toLowerCase().includes("trycloudflare")
    ) {
      friendlyMessage =
        "Servernya lagi mati bang, besok lagi gwa nyalain wkwkwkw";
    } else if (
      rawMsg.includes("503") ||
      rawMsg.toLowerCase().includes("high demand") ||
      rawMsg.toLowerCase().includes("unavailable")
    ) {
      friendlyMessage =
        "Server AI sedang mengalami lonjakan trafik. Silakan coba beberapa saat lagi.";
    } else if (
      rawMsg.toLowerCase().includes("timeout") ||
      rawMsg.toLowerCase().includes("econnreset") ||
      rawMsg.toLowerCase().includes("fetch failed") ||
      rawMsg.toLowerCase().includes("network")
    ) {
      friendlyMessage =
        "Koneksi internet terputus atau tidak stabil saat menghubungi server AI. Silakan periksa jaringan internet Anda dan coba lagi.";
    } else if (
      rawMsg.includes("Unexpected token") ||
      rawMsg.includes("is not valid JSON") ||
      rawMsg.includes("tidak valid sebagai format JSON")
    ) {
      friendlyMessage =
        "Respon analisis dokumen terpotong akibat gangguan jaringan. Silakan klik tombol untuk memproses ulang dokumen.";
    } else if (rawMsg) {
      friendlyMessage = rawMsg.replace(/^[^{]*\{/, "{").slice(0, 150);
      if (
        friendlyMessage.startsWith("{") ||
        friendlyMessage.includes("<!DOCTYPE") ||
        friendlyMessage.includes("<html")
      ) {
        friendlyMessage =
          "Gagal memproses dokumen akibat gangguan jaringan atau layanan AI.";
      }
    }

    return NextResponse.json(
      {
        error: friendlyMessage,
        details: error.status || 500,
      },
      { status: 500 },
    );
  }
}
