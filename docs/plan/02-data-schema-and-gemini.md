# Data Schema & Gemini AI Extraction Strategy

## 1. SDK & Model Configuration

- **SDK:** `@google/genai` (Official Google Gen AI SDK)
- **Model:** `gemini-2.5-flash` (or latest Flash multimodal model supporting structured outputs & multi-document parsing)
- **Parameters:**
  - `responseMimeType: "application/json"`
  - `responseSchema: wealthAnalysisSchema`
  - `temperature: 0.1` (Sangat rendah untuk memaksimalkan presisi ekstraksi angka dan meminimalkan halusinasi)

---

## 2. Extraction Schema Specification

Setiap dokumen akan dianalisis untuk mengekstrak entitas aset finansial dan non-finansial dengan format berikut:

```typescript
export type AssetCategory =
  | "SAHAM"
  | "PERUSAHAAN_SENDIRI"
  | "CRYPTO"
  | "PROPERTI"
  | "KAS_DEPOSITO"
  | "LAINNYA";

export interface ExtractedAssetItem {
  id: string;                      // Unique ID generated or extracted
  name: string;                    // Contoh: "BBCA (Bank Central Asia)", "Bitcoin (BTC)", "Ruko Sudirman"
  category: AssetCategory;
  institution?: string;            // Contoh: "Ajaib Sekuritas", "BCA", "Binance", "Indodax"
  quantity?: number;               // Jumlah lembar saham / unit crypto / luas m2
  unit?: string;                   // "lot", "lembar", "BTC", "m2", "unit"
  valueIdr: number;                // Estimasi atau nilai tercatat dalam Rupiah (IDR)
  originalCurrency?: string;       // "IDR", "USD", dll jika ada di dokumen
  originalValue?: number;          // Nilai asli dalam mata uang asli
  sourceFile: string;              // Nama file persis dokumen sumber (e.g. "portofolio_ajaib.png")
  notes?: string;                  // Catatan tambahan (e.g. "Kepemilikan 40% saham PT Maju")
}

export interface ExtractedLiabilityItem {
  id: string;
  name: string;                    // Contoh: "KPR Rumah Pondok Indah", "Margin Loan"
  lender?: string;                 // "Bank Mandiri"
  amountIdr: number;
  sourceFile: string;
  notes?: string;
}

export interface WealthAnalysisResult {
  executiveSummary: string;        // Narasi ringkasan eksekutif 2-3 kalimat mengenai profil aset
  currency: "IDR";
  assets: ExtractedAssetItem[];
  liabilities: ExtractedLiabilityItem[];
  keyHighlights: string[];         // 3-5 poin penting temuan dari dokumen
  detectedDocumentCount: number;
}
```

---

## 3. Interleaved Prompting Strategy

Untuk memastikan pelacakan sumber dokumen (*Source Tracking / Auditability*) bekerja akurat 100%, server menyusun payload input dengan menyisipkan label teks penanda nama file tepat sebelum data biner file terkait:

```typescript
// Konstruksi parts untuk Gemini API:
const contents = [
  {
    role: "user",
    parts: [
      { text: SYSTEM_INSTRUCTION_PROMPT },
      // Interleaved file inputs
      ...files.flatMap((file, idx) => [
        { text: `\n--- START OF DOCUMENT [${idx + 1}/${files.length}]: "${file.fileName}" (${file.mimeType}) ---` },
        {
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64Data,
          },
        },
        { text: `--- END OF DOCUMENT: "${file.fileName}" ---\n` }
      ]),
      { text: "Lakukan ekstraksi semua aset dan liabilitas dari dokumen-dokumen di atas sesuai schema JSON yang diminta. Pastikan setiap item mencantumkan nama file sumber yang sesuai pada field `sourceFile`." }
    ]
  }
];
```

---

## 4. Prompt Engineering Rules

1. **Aturan Mata Uang:** Jika dokumen mencatat nilai dalam mata uang asing (misal USD atau SGD), konversikan ke estimasi IDR dengan kurs wajar (atau kurs yang tercantum di dokumen), serta tetap cantumkan `originalValue` dan `originalCurrency`.
2. **Aturan Kategorisasi:**
   - Rekening koran, tabungan, giro, deposito -> `KAS_DEPOSITO`
   - Saham bursa (IHSG, NYSE, dll) -> `SAHAM`
   - Akta pendirian, saham perseroan tertutup, CV, PT -> `PERUSAHAAN_SENDIRI`
   - BTC, ETH, USDT, token crypto -> `CRYPTO`
   - Tanah, rumah, ruko, apartemen, sertifikat SHM/HGB -> `PROPERTI`
   - Logam mulia (emas), mobil mewah, jam tangan, dll -> `LAINNYA`
3. **Pemberian Identitas Dokumen Asal:** Model diinstruksikan secara tegas untuk mengisi `sourceFile` sesuai nama file tepat tempat item tersebut dibaca, sehingga pengguna dapat memverifikasi keabsahannya.
