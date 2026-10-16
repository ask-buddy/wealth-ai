import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { wealthAnalysisSchema } from "@/lib/schema";
import { RawWealthAnalysis } from "@/types/wealth";

interface IncomingFile {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

export const maxDuration = 180; // Extended execution timeout for multimodal document audit (up to 3 minutes)

function cleanAndExtractJson(raw: string): RawWealthAnalysis {
  let cleaned = raw.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    cleaned = cleaned.trim();
  }

  // Attempt direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // If it failed, attempt to find first '{' and last '}'
    const firstOpen = cleaned.indexOf("{");
    const lastClose = cleaned.lastIndexOf("}");

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const slice = cleaned.substring(firstOpen, lastClose + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // Last resort: strip trailing commas that might invalidate json
        const sanitized = slice
          .replace(/,\s*([\]}])/g, "$1")
          .replace(/\r\n/g, "\n");
        return JSON.parse(sanitized);
      }
    }
    throw new Error(
      "Respon data dari model AI tidak lengkap atau tidak valid sebagai JSON."
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: IncomingFile[] = body.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Minimal satu dokumen diperlukan untuk dianalisis." },
        { status: 400 }
      );
    }

    // Interleaved parts construction
    const systemInstruction = `Kamu adalah Wealth & Asset Intelligence Auditor tingkat tinggi untuk High-Net-Worth Individuals (HNWI).
Tugasmu adalah menganalisis dokumen finansial dan kepemilikan aset yang diberikan (PDF laporan sekuritas, rekening koran, screenshot portofolio saham/crypto, akta perusahaan, sertifikat properti/tanah, dll).

ATURAN PENTING:
1. EKSTRAKSI SEMUA ASET: Ekstrak setiap aset yang disebutkan secara eksplisit maupun implisit bernilai ekonomis.
2. AUDITABILITY (SOURCE TRACKING): Wajib mengisi 'sourceFile' dengan nama persis dari dokumen tempat aset atau liabilitas tersebut dibaca. JANGAN mengarang nama file lain.
3. KATEGORISASI KETAT: Gunakan hanya salah satu dari kategori berikut:
   - 'SAHAM': Saham perusahaan publik di bursa (IHSG, NYSE, Nasdaq, reksadana saham).
   - 'PERUSAHAAN_SENDIRI': Kepemilikan saham pada perseroan tertutup/startup/CV/PT pribadi.
   - 'CRYPTO': Bitcoin, Ethereum, USDT, dan aset kripto lainnya.
   - 'PROPERTI': Rumah, ruko, tanah, apartemen, sertifikat SHM/HGB.
   - 'KAS_DEPOSITO': Rekening tabungan bank, giro, deposito, reksadana pasar uang.
   - 'LAINNYA': Logam mulia (emas), obligasi negara/sukuk, kendaraan mewah, koleksi bernilai.
4. ESTIMASI NILAI (IDR): Nilai seluruh aset dalam Rupiah (IDR). Jika di dokumen tertulis valuta asing (USD, EUR, SGD), konversikan ke IDR estimasi (gunakan asumsi kurs wajar jika tidak tertulis kurs) dan catat originalCurrency dan originalValue.
5. NETRAL & OBJEKTIF: Jangan melebih-lebihkan angka, gunakan angka total saldo / portofolio yang tertera di dokumen.
6. FORMAT KELUARAN: HANYA kembalikan JSON murni tanpa pembungkus markdown apapun.`;

    const parts: any[] = [{ text: systemInstruction }];

    files.forEach((file, index) => {
      // Strip data URL header if present (e.g. "data:image/png;base64,...")
      const cleanBase64 = file.base64Data.includes("base64,")
        ? file.base64Data.split("base64,")[1]
        : file.base64Data;

      parts.push({
        text: `\n--- START OF DOCUMENT [${index + 1}/${files.length}]: "${file.fileName}" (MIME: ${file.mimeType}) ---`,
      });

      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: cleanBase64,
        },
      });

      parts.push({
        text: `--- END OF DOCUMENT: "${file.fileName}" ---\n`,
      });
    });

    parts.push({
      text: "Silakan ekstrak seluruh aset dan liabilitas dari dokumen-dokumen di atas sesuai dengan schema JSON yang ditentukan. Pastikan field sourceFile mencerminkan file asal yang tepat.",
    });

    // Execute generation with retry & combo fallback
    let responseText = "";
    let lastError: any = null;
    const maxRetries = 3;

    // Prioritize configured model, with fallback candidate (e.g., FireAce combo)
    const candidateModels = [GEMINI_MODEL];
    if (GEMINI_MODEL !== "FireAce") {
      candidateModels.push("FireAce");
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const modelToUse =
        attempt > 1 && candidateModels.length > 1
          ? candidateModels[1]
          : candidateModels[0];

      try {
        const response = await genAI.models.generateContent({
          model: modelToUse,
          contents: parts,
          config: {
            responseMimeType: "application/json",
            responseSchema: wealthAnalysisSchema,
            temperature: 0.1,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[Gemini API] Attempt ${attempt} (model: ${modelToUse}) failed: ${err.message}`
        );
        if (attempt < maxRetries) {
          // Wait 2s before retry
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    if (!responseText) {
      throw lastError || new Error("Gagal menerima respons dari model Gemini.");
    }

    // Parse with robust cleaner
    const parsedData: RawWealthAnalysis = cleanAndExtractJson(responseText);

    return NextResponse.json({
      success: true,
      data: parsedData,
      sourceCount: files.length,
    });
  } catch (error: any) {
    console.error("API Analyze Error:", error);

    const rawMsg = error?.message || "";
    let friendlyMessage = "Terjadi kendala saat menganalisis dokumen.";

    if (
      rawMsg.includes("503") ||
      rawMsg.toLowerCase().includes("high demand") ||
      rawMsg.toLowerCase().includes("unavailable")
    ) {
      friendlyMessage =
        "Server AI sedang mengalami lonjakan trafik (High Demand). 9router telah dikonfigurasi ke combo FireAce untuk fallback otomatis, silakan coba beberapa saat lagi.";
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
      rawMsg.includes("tidak valid sebagai JSON")
    ) {
      friendlyMessage =
        "Respon analisis dokumen terpotong akibat koneksi tidak stabil. Silakan klik tombol untuk memproses ulang dokumen.";
    } else if (rawMsg) {
      // Use clean string without stack traces or raw json delimiters
      friendlyMessage = rawMsg.replace(/^[^{]*\{/, "{").slice(0, 150);
      if (friendlyMessage.startsWith("{")) {
        friendlyMessage = "Gagal memproses dokumen akibat gangguan jaringan atau layanan AI.";
      }
    }

    return NextResponse.json(
      {
        error: friendlyMessage,
        details: error.status || 500,
      },
      { status: 500 }
    );
  }
}
