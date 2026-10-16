import { NextRequest, NextResponse } from "next/server";
import {
  genAI,
  GEMINI_MODEL,
  GEMINI_BASE_URL,
  GEMINI_API_KEY,
  GEMINI_CANDIDATE_MODELS,
} from "@/lib/gemini";
import { assetExtractionSchema } from "@/lib/schema";
import {
  ExtractedAssetItem,
  ExtractedLiabilityItem,
} from "@/types/wealth";
import { normalizeCategory, parseFlexibleNumber } from "@/lib/math";

interface IncomingFile {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

export const maxDuration = 180; // Extended execution timeout for multimodal document audit (up to 3 minutes)

const SYSTEM_INSTRUCTION = `
Anda adalah Auditor Finansial AI institusional dengan akurasi 100%. Tugas utama Anda adalah mengekstrak data aset keuangan faktual dari setiap dokumen visual atau PDF yang dilampirkan ke dalam format JSON yang valid.

HANYA kembalikan satu objek JSON valid dengan struktur skema berikut:
{
  "assets": [
    {
      "asset_name": "string (nama institusi/produk/emiten/pemegang saham)",
      "category": "SAHAM | PERUSAHAAN_SENDIRI | CRYPTO | PROPERTI | KAS_DEPOSITO | EMAS_LOGAM_MULIA | OBLIGASI_SBN | KENDARAAN | LAINNYA",
      "estimated_value_idr": number (nilai moneter dalam rupiah, integer murni tanpa titik/koma/desimal),
      "quantity_or_ownership_detail": "string (contoh: '0.011 gram', 'Saldo Aktif', '60% saham', '100 Lot', dsb)",
      "source_file": "string (nama file dokumen asal item ini)"
    }
  ],
  "liabilities": [],
  "unreadable_or_skipped_files": [],
  "executive_summary": "string (ringkasan 2-3 kalimat mengenai hasil audit dan total aset)"
}

PATUHI ATURAN AUDIT BERIKUT TANPA PENGECUALIAN:

1. ATURAN SCREENSHOT BANKING (myBCA / BCA Mobile / Mandiri / BRI / BNI / Bank Lainnya):
   - Masukkan ke kategori KAS_DEPOSITO.
   - Ekstrak "Active Balance" / "Saldo Efektif" / "Available Balance" / "Saldo Tabungan".
   - PERHATIAN FORMAT: Format myBCA (English UI) mencantumkan nilai seperti "IDR 56,498.48". Hilangkan sen desimal di belakang titik, bulatkan ke rupiah terdekat: 56498.

2. ATURAN FINTECH EMAS & INVESTASI (TREASURY, PEGADAIAN, PLUANG):
   - Pada screenshot yang menampilkan kartu rincian:
     * "Tabungan Emas" (dengan nominal dan gramasi) -> Masukkan ke kategori EMAS_LOGAM_MULIA. Contoh: nominal IDR 25.297, gramasi "0.011 gram" -> estimated_value_idr: 25297.
     * "Saldo IDR" / Dompet Tunai -> Masukkan ke kategori KAS_DEPOSITO. Contoh: nominal IDR 110.951 -> estimated_value_idr: 110951.
   - HINDARI DOUBLE-COUNTING: JANGAN ekstrak kartu "Total Aset" di atasnya (misal Rp 136.248) jika kartu rincian Tabungan Emas dan Saldo IDR sudah diekstrak.

3. ATURAN SEKURITAS & INVESTASI (AJAIB, STOCKBIT, IPOT, BIBIT, PLUANG):
   - Ekstrak setiap instrumen yang dimiliki:
     * Posisi Saham (misal: ENVY - Envy Technologies Indonesia Tbk.) -> Kategori SAHAM, nilai sesuai nominal nilai pasar saat ini (misal Rp 10.000 -> 10000).
     * Posisi Reksa Dana (misal: Eastspring Investments Cash Reserve) -> Kategori SAHAM, nilai sesuai Total Value (misal Rp 11.782 -> 11782).
   - HINDARI DOUBLE-COUNTING: JANGAN ekstrak kartu "Est. Total Aset" atau "Total Portofolio" jika instrumen saham dan reksa dana sudah diekstrak.

4. ATURAN DOKUMEN LEGAL (AKTA PENDIRIAN PERSEROAN / NOTARIS / KEMENKUMHAM):
   - Kategori: PERUSAHAAN_SENDIRI.
   - Ekstrak modal yang ditempatkan dan disetor penuh.
   - Jika terdapat daftar pemegang saham pendiri, ekstrak kepemilikan saham dari masing-masing pemegang saham pendiri:
     * Nama: "PT [Nama PT] - Saham [Nama Pendiri]"
     * Nilai: nominal modal disetor pemegang saham tersebut dalam Rupiah penuh
     * Detail: persentase dan jumlah lembar saham (contoh: "60% saham (2.400 Lembar)")

5. ATURAN FORMAT ANGKA (STRICT INTEGER):
   - estimated_value_idr HARUS berupa integer murni (Number) tanpa titik atau koma pemisah ribuan.
   - Contoh konversi:
     * "IDR 56,498.48" -> 56498
     * "Rp 136.248" -> 136248
     * "Rp 10.000" -> 10000
     * "Rp 11.782" -> 11782
     * "Rp 4.000.000.000" -> 4000000000

6. ATURAN SUMBER DOKUMEN (source_file):
   - Isi field source_file pada setiap aset persis sama dengan nama file asal dokumen tempat aset tersebut ditemukan.
`;

function cleanAndExtractJson(raw: string): any {
  let cleaned = raw.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    cleaned = cleaned.trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstOpen = cleaned.indexOf("{");
    const lastClose = cleaned.lastIndexOf("}");

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const slice = cleaned.substring(firstOpen, lastClose + 1);
      try {
        return JSON.parse(slice);
      } catch {
        const sanitized = slice
          .replace(/,\s*([\]}])/g, "$1")
          .replace(/\r\n/g, "\n");
        return JSON.parse(sanitized);
      }
    }
    throw new Error(
      "Respon data dari model AI tidak lengkap atau tidak valid sebagai format JSON.",
    );
  }
}

async function callChatCompletionsVision(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: any[],
  temperature = 0.0,
): Promise<string> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, "");
  const apiRoot = cleanBase.endsWith("/v1") ? cleanBase : `${cleanBase}/v1`;
  const url = `${apiRoot}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      stream: false,
      temperature,
      messages: messages,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    console.error(`[9router API Error ${res.status}] Target URL: ${url}`, raw.slice(0, 300));
    throw new Error(`[API Error ${res.status}] ${raw.slice(0, 300)}`);
  }

  // Check if response is Server-Sent Events (SSE)
  if (raw.startsWith("data:")) {
    const lines = raw.split("\n");
    let content = "";
    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(line.substring(6));
          const delta =
            parsed.choices?.[0]?.delta?.content ||
            parsed.choices?.[0]?.message?.content ||
            "";
          content += delta;
        } catch {}
      }
    }
    return content;
  }

  const json = JSON.parse(raw);
  return json.choices?.[0]?.message?.content || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: IncomingFile[] = body.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Minimal satu dokumen diperlukan untuk dianalisis." },
        { status: 400 },
      );
    }

    // Build multimodal messages for OpenAI-compatible chat completions
    const userContent: any[] = [
      {
        type: "text",
        text: `Berikut adalah ${files.length} dokumen finansial dan bukti aset. Silakan lakukan audit menyeluruh dan ekstrak seluruh aset keuangan dari setiap dokumen secara lengkap, akurat, dan faktual sesuai instruksi sistem tanpa double counting.`,
      },
    ];

    files.forEach((file, index) => {
      const cleanBase64 = file.base64Data.includes("base64,")
        ? file.base64Data.split("base64,")[1]
        : file.base64Data;

      userContent.push({
        type: "text",
        text: `--- DOKUMEN ${index + 1} | Nama File: "${file.fileName}" ---`,
      });

      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${file.mimeType};base64,${cleanBase64}`,
        },
      });
    });

    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: userContent },
    ];

    let responseText = "";
    let lastError: any = null;
    const maxRetries = 2;

    const candidateModels = GEMINI_CANDIDATE_MODELS;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const modelToUse =
        attempt > 1 && candidateModels.length > 1
          ? candidateModels[1]
          : candidateModels[0];

      try {
        responseText = await callChatCompletionsVision(
          GEMINI_BASE_URL,
          GEMINI_API_KEY,
          modelToUse,
          messages,
          0.0,
        );

        if (responseText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[ChatCompletions Vision] Attempt ${attempt} (model: ${modelToUse}) failed: ${err.message}`,
        );

        // Fallback to GoogleGenAI SDK if ChatCompletions fails
        try {
          const contents: any[] = [];
          files.forEach((file, index) => {
            const cleanBase64 = file.base64Data.includes("base64,")
              ? file.base64Data.split("base64,")[1]
              : file.base64Data;

            contents.push({
              text: `--- DOKUMEN ${index + 1} | Nama File: "${file.fileName}" ---`,
            });
            contents.push({
              inlineData: {
                mimeType: file.mimeType,
                data: cleanBase64,
              },
            });
          });
          contents.push({
            text: "Ekstrak seluruh data aset yang tampak pada dokumen di atas secara akurat sesuai instruksi sistem.",
          });

          const geminiRes = await genAI.models.generateContent({
            model: modelToUse,
            contents: contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: assetExtractionSchema,
              temperature: 0.0,
            },
          });

          if (geminiRes.text) {
            responseText = geminiRes.text;
            break;
          }
        } catch (geminiErr: any) {
          console.warn(`[Gemini SDK Fallback] failed: ${geminiErr.message}`);
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    if (!responseText) {
      throw lastError || new Error("Gagal menerima respons dari model AI.");
    }

    // Parse structured outputs response
    const rawParsed: any = cleanAndExtractJson(responseText);

    const rawAssetsList =
      rawParsed.assets ||
      rawParsed.aset ||
      rawParsed.daftar_aset ||
      rawParsed.extracted_assets ||
      rawParsed.assetList ||
      rawParsed.data?.assets ||
      rawParsed.data?.aset ||
      rawParsed.data?.extracted_assets ||
      [];

    // Format directly into the application's clean internal structure
    const formattedAssets: ExtractedAssetItem[] = rawAssetsList.map(
      (item: any, idx: number) => {
        const rawNum =
          item.estimated_value_idr ??
          item.value_idr ??
          item.nilai ??
          item.valueIdr ??
          item.valueIDR ??
          item.value ??
          item.original_value ??
          item.amount ??
          item.nominal ??
          0;

        const numericVal = parseFlexibleNumber(rawNum);

        let detailNote =
          item.quantity_or_ownership_detail ||
          item.keterangan ||
          item.deskripsi ||
          item.kuantitas ||
          item.notes ||
          item.description ||
          "";
        if (
          !detailNote &&
          (item.quantity !== undefined || item.unit !== undefined)
        ) {
          detailNote = `${item.quantity ?? ""} ${item.unit ?? ""}`.trim();
        }

        const rawCat =
          item.category ||
          item.kategori ||
          item.sub_category ||
          item.asset_type ||
          "";

        return {
          id: `ast-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name:
            item.asset_name ||
            item.nama_aset ||
            item.name ||
            item.nama ||
            item.title ||
            `Aset #${idx + 1}`,
          category: normalizeCategory(rawCat),
          valueIdr: numericVal,
          originalCurrency: item.original_currency || item.originalCurrency || item.mata_uang || "IDR",
          originalValue: typeof item.original_value === "number" ? item.original_value : numericVal,
          sourceFile:
            item.source_file ||
            item.sourceFile ||
            item.dokumen ||
            files[0]?.fileName ||
            "Dokumen Sumber",
          notes: detailNote,
        };
      },
    );

    const rawLiabilitiesList =
      rawParsed.liabilities ||
      rawParsed.liabilitas ||
      rawParsed.hutang ||
      rawParsed.daftar_liabilitas ||
      rawParsed.extracted_liabilities ||
      rawParsed.liabilitiesList ||
      rawParsed.data?.liabilities ||
      [];

    const formattedLiabilities: ExtractedLiabilityItem[] =
      rawLiabilitiesList.map((item: any, idx: number) => {
        const rawAmt =
          item.amount_idr ??
          item.nilai ??
          item.jumlah ??
          item.amountIdr ??
          item.amountIDR ??
          item.amount ??
          0;

        const numericAmt = parseFlexibleNumber(rawAmt);

        return {
          id: `lia-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name:
            item.liability_name ||
            item.nama_liabilitas ||
            item.nama_hutang ||
            item.name ||
            item.nama ||
            item.title ||
            `Liabilitas #${idx + 1}`,
          lender: item.lender || item.kreditur || item.bank || item.pemberi_pinjaman || "",
          amountIdr: numericAmt,
          sourceFile:
            item.source_file ||
            item.sourceFile ||
            item.dokumen ||
            files[0]?.fileName ||
            "Dokumen Sumber",
          notes: item.notes || item.keterangan || item.description || "",
        };
      });

    // Clean up unreadable files list
    const extractedFileNames = new Set(
      formattedAssets.map((a) => a.sourceFile.trim().toLowerCase()),
    );
    const rawSkipped =
      rawParsed.unreadable_or_skipped_files ||
      rawParsed.unreadableFiles ||
      rawParsed.skipped_files ||
      rawParsed.file_gagal ||
      [];
    const cleanUnreadable = Array.isArray(rawSkipped)
      ? rawSkipped.filter(
          (f: string) => !extractedFileNames.has(String(f).trim().toLowerCase()),
        )
      : [];

    return NextResponse.json({
      success: true,
      data: {
        executiveSummary:
          rawParsed.executive_summary ||
          rawParsed.executiveSummary ||
          rawParsed.summary ||
          rawParsed.ringkasan ||
          "Audit dokumen berhasil mengekstrak seluruh instrumen aset secara faktual.",
        currency: "IDR",
        assets: formattedAssets,
        liabilities: formattedLiabilities,
        unreadableFiles: cleanUnreadable,
      },
      sourceCount: files.length,
    });
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
