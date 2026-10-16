# Private Wealth & Asset Aggregator AI (Gemini Cup Builder Hackathon)

## 1. Project Overview & Background

Proyek ini adalah aplikasi web berbasis **Next.js (App Router)** yang dirancang untuk **High-Net-Worth Individuals (HNWI)**, pemilik bisnis, dan eksekutif guna menghitung dan memetakan total kekayaan (_Net Worth_) mereka secara instan dari berbagai dokumen yang tercecer (PDF laporan sekuritas, foto akta perusahaan, screenshot portofolio crypto/saham, bukti kepemilikan properti, dan rekening koran).

### Masalah yang Diselesaikan (Problem Statement)

Pemilik bisnis dan eksekutif sering kali memiliki aset yang tersebar di banyak instrumen dan dokumen fisik/digital. Meminta asisten atau bawahan untuk merekap dokumen-dokumen ini menimbulkan risiko kebocoran data finansial yang sangat sensitif.

### Solusi & Nilai Utama (Core Value Proposition)

1. **Zero-Database & Local-First Privacy:** Aplikasi **TIDAK MENGGUNAKAN DATABASE SERVER**. Semua file diproses secara _in-memory_ (numpang lewat di RAM untuk dikirim ke Gemini API) dan hasil ekstraksinya hanya disimpan di sisi client (`localStorage`).
2. **Multimodal One-Shot Extraction:** Memanfaatkan kemampuan _native multimodal_ **Gemini 3.8 Flash** untuk membaca berbagai format file (`JPG`, `JPEG`, `PNG`, `PDF`) sekaligus tanpa OCR eksternal.
3. **Source Tracking (Auditability):** Setiap item aset yang diekstrak memiliki referensi asal dokumen (`source_file`), sehingga user tahu persis dari file mana angka tersebut berasal.

---

## 2. Core User Flow (UX Journey)

1. **Upload Multi-Format:** User membuka aplikasi dan melakukan _drag-and-drop_ berbagai file (`PDF`, `JPG`, `JPEG`, `PNG`) sekaligus di satu halaman.
2. **Client-Side Pre-processing:**
   - File gambar (`JPG/PNG`) dikompresi di browser jika ukurannya terlalu besar agar pengiriman cepat.
   - Semua file diubah menjadi string `Base64` murni beserta metadata `fileName` dan `mimeType`.
3. **Stateless AI Extraction:** Data dikirim ke `/api/analyze`. Server meneruskan ke Gemini 3.8 Flash dengan teknik _Interleaved Prompting_ (menyisipkan label nama file sebelum tiap data biner file) dan mengunci output menggunakan **Structured Outputs (`responseSchema`)**.
4. **Client-Side Calculation & Storage:**
   - Browser menerima JSON terstruktur dari API dan menyimpannya ke `localStorage`.
   - Kalkulasi total kekayaan (_Net Worth_) dan persentase (`%`) per kategori dihitung menggunakan fungsi JavaScript murni di client (bukan oleh AI, untuk menghindari halusinasi matematika).
5. **Interactive Dashboard & Drill-Down:**
   - Menampilkan **Total Kekayaan (IDR)** dan **Executive Summary**.
   - Menampilkan **Pie Chart** distribusi aset dan **Category Cards** di sampingnya (`SAHAM`, `PERUSAHAAN_SENDIRI`, `CRYPTO`, `PROPERTI`, `KAS_DEPOSITO`, `LAINNYA`).
   - **Drill-Down Interaction:** Ketika user mengklik salah satu Card Kategori atau bagian Pie Chart (misal: `SAHAM`), UI menampilkan daftar detail item di kategori tersebut (nama saham, jumlah lot/lembar, nilai IDR) beserta **Badge Nama File Asal (`source_file`)**.
6. **Export PDF Summary:** User dapat menekan tombol "Export PDF" untuk mengunduh laporan ringkasan kekayaan secara langsung dari browser (`react-to-print` atau `jspdf`).

---

## 3. Tech Stack & Libraries

- **Framework:** Next.js (App Router, TypeScript)
- **Styling & UI Components:** Tailwind CSS, Shadcn UI, Lucide Icons
- **Data Visualization:** Recharts (Pie Chart / Donut Chart interaktif)
- **AI SDK:** `@google/genai` (Official Google Gen AI SDK terbaru — **JANGAN** gunakan `@google/generative-ai` yang sudah _deprecated_)
- **AI Model:** `gemini-terbaru` (dengan `responseMimeType: "application/json"` dan `responseSchema`)
- **State & Storage:** React State (`useState`, `useEffect`) + Browser `localStorage`
- **PDF Export:** `react-to-print` atau `jspdf` + `html2canvas`

---

## 4. Architecture & Data Pipeline Diagram

```text
[Browser: User Uploads JPG/PNG/PDF]
        │
        ▼
[Browser: Convert to Base64 + Attach fileName & mimeType]
        │
        ▼ (POST /api/analyze - Stateless, No DB)
[Next.js API Route: Build Interleaved Prompt + Call Gemini 3.8 Flash]
        │
        ▼ (Strict JSON Schema Output)
[Browser: Save JSON to localStorage]
        │
        ├──► [JS Math Engine: Group by Category, Sum Values & Calculate %]
        │
        ├──► [Render Pie Chart + Category Summary Cards]
        │
        ├──► [On Category Click: Filter items by Category & Show `source_file`]
        │
        └──► [On Export Click: Generate Printable PDF Summary Report]
```
