import {
  GEMINI_BASE_URL,
  GEMINI_API_KEY,
  GEMINI_CANDIDATE_MODELS,
  genAI,
} from "../ai/config";
import { callChatCompletionsVision, cleanAndExtractJson } from "../ai/client";
import {
  FINANCIAL_AUDIT_SYSTEM_INSTRUCTION,
  assetExtractionSchema,
} from "../ai/prompts";
import {
  ExtractedAssetItem,
  ExtractedLiabilityItem,
} from "@/types/wealth";
import { normalizeCategory, parseFlexibleNumber } from "@/lib/math";

export interface IncomingDocumentFile {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

export interface AnalysisPayload {
  executiveSummary: string;
  currency: "IDR";
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
  unreadableFiles: string[];
}

export interface AnalysisServiceResult {
  success: boolean;
  data: AnalysisPayload;
  sourceCount: number;
}

/**
 * Core business service for multimodal financial document audit.
 * Fully decoupled from NextRequest/NextResponse.
 * Can be reused in Mac apps (Electron/Tauri), CLI tools, or cloud workers.
 */
export async function analyzePortfolioDocuments(
  files: IncomingDocumentFile[],
): Promise<AnalysisServiceResult> {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error("Minimal satu dokumen diperlukan untuk dianalisis.");
  }

  // 1. Build multimodal payload
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
    { role: "system", content: FINANCIAL_AUDIT_SYSTEM_INSTRUCTION },
    { role: "user", content: userContent },
  ];

  // 2. Multi-attempt retry loop with fallback models & SDK fallback
  let responseText = "";
  let lastError: any = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const modelToUse =
      attempt > 1 && GEMINI_CANDIDATE_MODELS.length > 1
        ? GEMINI_CANDIDATE_MODELS[1]
        : GEMINI_CANDIDATE_MODELS[0];

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
        `[Analysis Service] Attempt ${attempt} (model: ${modelToUse}) failed: ${err.message}`,
      );

      // Fallback to GoogleGenAI SDK if ChatCompletions fails
      try {
        const geminiParts: any[] = [
          { text: FINANCIAL_AUDIT_SYSTEM_INSTRUCTION },
        ];

        files.forEach((file, idx) => {
          const cleanB64 = file.base64Data.includes("base64,")
            ? file.base64Data.split("base64,")[1]
            : file.base64Data;

          geminiParts.push({
            text: `--- DOKUMEN ${idx + 1} | Nama File: "${file.fileName}" ---`,
          });
          geminiParts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: cleanB64,
            },
          });
        });

        const geminiRes = await genAI.models.generateContent({
          model: modelToUse,
          contents: geminiParts,
          config: {
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
        console.warn(`[Analysis Service SDK Fallback] failed: ${geminiErr.message}`);
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  if (!responseText) {
    throw lastError || new Error("Gagal menerima respons dari model AI.");
  }

  // 3. Parse and sanitize structured output
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
        originalCurrency:
          item.original_currency || item.originalCurrency || item.mata_uang || "IDR",
        originalValue:
          typeof item.original_value === "number" ? item.original_value : numericVal,
        sourceFile:
          item.source_file ||
          item.sourceFile ||
          item.dokumen ||
          files[0]?.fileName ||
          "Dokumen Sumber",
        notes: detailNote,
        box_2d:
          Array.isArray(item.box_2d) && item.box_2d.length === 4
            ? [item.box_2d[0], item.box_2d[1], item.box_2d[2], item.box_2d[3]]
            : undefined,
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

  const formattedLiabilities: ExtractedLiabilityItem[] = rawLiabilitiesList.map(
    (item: any, idx: number) => {
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
        box_2d:
          Array.isArray(item.box_2d) && item.box_2d.length === 4
            ? [item.box_2d[0], item.box_2d[1], item.box_2d[2], item.box_2d[3]]
            : undefined,
      };
    },
  );

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

  return {
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
  };
}
