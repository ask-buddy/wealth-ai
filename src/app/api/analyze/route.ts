import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { assetExtractionSchema } from "@/lib/schema";
import {
  ExtractedAssetItem,
  ExtractedLiabilityItem,
  AssetCategory,
} from "@/types/wealth";
import { normalizeCategory } from "@/lib/math";

interface IncomingFile {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

export const maxDuration = 180; // Extended execution timeout for multimodal document audit (up to 3 minutes)

const SYSTEM_INSTRUCTION = `
Anda adalah mesin AI Auditor Kekayaan & Ekstraksi Aset Keuangan tingkat institusional dengan tingkat presisi tinggi. Tugas tunggal Anda adalah membaca dokumen visual (screenshot aplikasi finansial, dokumen legal, laporan investasi, dan bukti kepemilikan aset dalam Bahasa Indonesia maupun Bahasa Inggris) lalu mengekstrak daftar aset secara faktual ke dalam skema JSON yang telah ditentukan.

PATUHI ATURAN MUTLAK BERIKUT TANPA PENGECUALIAN:

1. STRICT GROUNDING & IDENTIFIKASI DOKUMEN:
   - Screenshot aplikasi finansial/investasi/fintech (seperti Treasury, Pegadaian, Pluang, Bibit, Stockbit, Ajaib, e-wallet, Bank Digital, dsb) WALAUPUN memuat foto avatar pengguna, banner onboarding, atau checklist pendaftaran di bagian atas, ADALAH DOKUMEN ASET FINANSIAL YANG VALID DAN WAJIB DIEKSTRAK!
   - Periksa seluruh area layar: cari kartu saldo, "Total Aset", "Tabungan Emas", "Saldo IDR", "Portofolio", saldo kas/rekening.
   - HANYA masukkan nama file ke dalam \`unreadable_or_skipped_files\` jika dokumen tersebut benar-benar murni 100% foto selfie pribadi, foto pemandangan, meme, dokumen teks kosong, atau tangkapan layar chat WhatsApp tanpa nilai aset finansial.

2. ATURAN SCREENSHOT APLIKASI EMAS DIGITAL & FINTECH (TREASURY, SHARIACOIN, PEGADAIAN, PLUANG, LAKUEMAS):
   - Pada aplikasi seperti **Treasury**: Layar beranda biasanya menampilkan kartu "Tabungan Emas" (dengan nominal Rupiah dan gramasi) serta kartu "Saldo IDR / Dompet / Saldo Tunai".
   - Ekstrak SETIAP kartu aset tersebut sebagai item terpisah:
     * "Tabungan Emas" -> Masukkan ke kategori \`LAINNYA\`, nama: "Tabungan Emas Treasury" (atau sesuai aplikasi), nilai: nominal Rupiah yang tertera, detail: gramasi (contoh: "0.011 gram").
     * "Saldo IDR" -> Masukkan ke kategori \`KAS_DEPOSITO\`, nama: "Saldo IDR Treasury", nilai: nominal Rupiah saldo kas yang tertera.
   - HINDARI DOUBLE-COUNTING: Jika Anda mengekstrak kartu rincian "Tabungan Emas" dan "Saldo IDR", JANGAN mengekstrak kartu "Total Aset" di atasnya agar tidak terhitung dua kali.
   - Jika hanya ada satu angka Total Aset tanpa rincian kartu di bawahnya, barulah ekstrak kartu Total Aset tersebut.

3. ATURAN KHUSUS SCREENSHOT PORTOFOLIO SAHAM & REKSADANA (STOCKBIT, AJAIB, IPOT, BIBIT, BIONS, DLL.):
   - HINDARI DOUBLE-COUNTING: Di bagian atas layar biasanya tertera "Total Portofolio / Total Equity / Nilai Investasi", dan di bawahnya terdapat daftar emiten (misal: BBCA, BMRI, TLKM, BBRI) atau produk Reksadana.
   - JIKA daftar saham individual terlihat: Ekstrak SETIAP saham sebagai item terpisah di kategori \`SAHAM\`. JANGAN mengekstrak angka "Total Portofolio" di bagian atas.
   - Gunakan angka **"Market Value" / "Nilai Pasar Saat Ini" / "Current Value"**, BUKAN "Modal / Invested / Avg Buy" dan BUKAN angka "Unrealized Gain/Loss (Return +/-)".
   - Jika terdapat baris **"RDN / Cash / Saldo RDN / Buying Power / Trading Balance"** yang berdiri sendiri di dalam screenshot sekuritas, ekstrak saldo RDN tersebut sebagai item terpisah dengan kategori \`KAS_DEPOSITO\` (Contoh: "Saldo RDN Stockbit").
   - Untuk detail kuantitas (\`quantity_or_ownership_detail\`), catat jumlah Lot (1 Lot = 100 lembar) dan harga rata-rata/pasar jika terlihat (Contoh: "120 Lot (Avg Rp 9.800)").

4. ATURAN KHUSUS SCREENSHOT SALDO M-BANKING (BCA MOBILE, MYBCA, LIVIN MANDIRI, BRIMO, BNI, JENIUS, JAGO, BLU, SEA BANK):
   - Masukkan ke dalam kategori \`KAS_DEPOSITO\`.
   - Jika berupa screenshot halaman Info Saldo: Ekstrak **"Saldo Efektif" / "Available Balance" / "Total Saldo"**.
   - Jika terdapat pemisahan "Tabungan Utama" dan "Deposito / Kantong (Pockets) / Tahapan Berjangka", ekstrak masing-masing jika rinciannya terlihat, atau ambil Total Keseluruhan (pilih salah satu agar tidak terhitung ganda).
   - Jika berupa screenshot Mutasi Rekening / Rekening Koran: ABAIKAN seluruh baris transaksi debit/kredit/transfer. Hanya ambil **"Saldo Akhir" (Ending Balance)** pada tanggal terbaru.
   - Sensor nomor rekening: Ambil hanya 4 digit terakhir (Contoh: "Tabungan Livin Mandiri ****8821").

5. ATURAN KHUSUS FOTO STNK / BPKB / PAJAK KENDARAAN BERMOTOR:
   - Masukkan ke dalam kategori \`LAINNYA\` dengan awalan nama "Kendaraan:" (Contoh: "Kendaraan: Toyota Kijang Innova Zenix 2023" atau "Kendaraan: Honda PCX 160 2022").
   - Ekstrak Merk, Tipe/Model, dan Tahun Pembuatan dari STNK/BPKB untuk dimasukkan ke \`asset_name\` dan \`quantity_or_ownership_detail\`. Sensor Nomor Polisi (Plat Nomor) dan Nomor Rangka/Mesin demi privasi.
   - CARA MENGHITUNG NILAI KENDARAAN (\`estimated_value_idr\`) DARI STNK:
     * KASUS A (Lembar Ketetapan Pajak / TBPKP Terlihat): JANGAN gunakan angka "Total Pajak" sebagai nilai aset! Gunakan angka **"NJKB" (Nilai Jual Kendaraan Bermotor)** jika tertulis. Jika hanya tertulis nilai **PKB Pokok**, estimasikan nilai pasar kendaraan dengan rumus: \`PKB Pokok x 50\` (karena PKB rata-rata adalah ~2% dari NJKB).
     * KASUS B (Hanya Lembar STNK Identitas Kendaraan): Berikan estimasi harga pasar wajar kendaraan bekas berdasarkan Merk, Tipe, CC, dan Tahun Pembuatan yang tertulis jelas di STNK, dan cantumkan keterangan "(Estimasi Pasar dari STNK)" pada \`quantity_or_ownership_detail\`.

6. ATURAN DOKUMEN BERBAHASA INGGRIS (INTERNATIONAL BROKERS, US STOCKS, CRYPTO, FOREIGN BANKING):
   - Sistem wajib memahami terminologi keuangan Bahasa Inggris:
     * "Net Liquidation Value" / "Total Equity" / "Market Value" / "Holdings" = Nilai aset saat ini.
     * "Shares" / "Units" = Jumlah lembar/unit kepemilikan.
     * "Cost Basis" / "Avg Price" / "Unrealized P&L" = Modal/Keuntungan (JANGAN gunakan ini sebagai nilai utama aset, gunakan Market Value).
     * "Checking Account" / "Savings" / "Time Deposit" / "Cash Equivalents" = Kategori \`KAS_DEPOSITO\`.
     * "Common Stock" / "Equities" / "Mutual Funds" / "ETF" / "Treasury Bonds" = Kategori \`SAHAM\`.
     * "Real Estate" / "Deed of Sale" / "Property Valuation" = Kategori \`PROPERTI\`.
     * "Articles of Incorporation" / "Shareholder Agreement" / "Private Equity" = Kategori \`PERUSAHAAN_SENDIRI\`.
   - PERHATIAN FORMAT ANGKA INGGRIS VS INDONESIA:
     * Dokumen Bahasa Inggris ($, USD, USDT, SGD, £, €): Koma (,) adalah pemisah ribuan, Titik (.) adalah desimal. Contoh: \`$12,500.50\` = 12500.50.
     * Dokumen Bahasa Indonesia (Rp / IDR): Titik (.) adalah pemisah ribuan, Koma (,) adalah desimal. Contoh: \`Rp 12.500.000,00\` = 12500000.
   - Singkatan: \`$15.5K\` = 15.500 USD; \`$1.2M\` = 1.200.000 USD; \`15,5 Jt\` = 15.500.000 IDR; \`1,2 M\` = 1.200.000.000 IDR.
   - Kurs konversi ke Rupiah (\`estimated_value_idr\`):
     * 1 USD / USDT / USDC = Rp 16.000
     * 1 SGD = Rp 12.000
     * 1 EUR = Rp 17.500
     * 1 AUD = Rp 10.500

7. ATURAN AKTA PERUSAHAAN & PROPERTI:
   - Untuk Akta Notaris/SK Kemenkumham: Ekstrak nama PT, persentase saham, dan nominal modal disetor ke kategori \`PERUSAHAAN_SENDIRI\`.
   - Untuk Sertifikat Tanah/Properti (SHM/SHGB/AJB/PBB): Ekstrak lokasi/nama properti dan luas ke kategori \`PROPERTI\`. Gunakan nilai NJOP total atau harga transaksi di AJB sebagai \`estimated_value_idr\`.

8. ATURAN PELACAKAN SUMBER FILE (\`source_file\`):
   - Setiap dokumen diawali dengan teks penanda \`--- DOKUMEN X | Nama File: "[nama_file_asli]" ---\`.
   - Anda WAJIB mengisi field \`source_file\` pada setiap aset persis sama dengan \`Nama File\` dokumen asal aset tersebut.
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
      text: "Ekstrak seluruh data aset yang tampak pada dokumen di atas secara akurat sesuai instruksi sistem. Jika terdapat screenshot aplikasi investasi/keuangan (seperti Treasury, Bareksa, Pluang, Bibit, Stockbit, M-Banking), pastikan membaca dan mengekstrak kartu Tabungan Emas, Saldo IDR, dan saldo portofolio.",
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
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: assetExtractionSchema,
            temperature: 0.0, // WAJIB 0.0 untuk ekstraksi data finansial agar deterministik & tidak mengarang
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[Gemini API] Attempt ${attempt} (model: ${modelToUse}) failed: ${err.message}`,
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

        const numericVal =
          typeof rawNum === "number"
            ? rawNum
            : parseFloat(String(rawNum).replace(/[^0-9.-]+/g, "")) || 0;

        // Auto detail notes from quantity and unit if separate
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

        const numericAmt =
          typeof rawAmt === "number"
            ? rawAmt
            : parseFloat(String(rawAmt).replace(/[^0-9.-]+/g, "")) || 0;

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

    // Clean up unreadable files list: If any asset was extracted from a file, it must NOT be marked as unreadable!
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
      rawMsg.includes("tidak valid sebagai format JSON")
    ) {
      friendlyMessage =
        "Respon analisis dokumen terpotong akibat koneksi tidak stabil. Silakan klik tombol untuk memproses ulang dokumen.";
    } else if (rawMsg) {
      friendlyMessage = rawMsg.replace(/^[^{]*\{/, "{").slice(0, 150);
      if (friendlyMessage.startsWith("{")) {
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
