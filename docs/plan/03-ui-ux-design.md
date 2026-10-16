# UI / UX Design & Interaction Specification

## 1. Design Aesthetic & Principles

- **Target Audience:** High-Net-Worth Individuals (HNWI), Founders, C-Level Executives.
- **Tone & Mood:** Ultra-clean, prestigious, modern private banking & wealth intelligence (mirip Bloomberg Terminal x Linear x Carta).
- **Color Palette:**
  - **Background:** Clean Deep Slate (`#0B0F17` in Dark Mode, Crisp Pearl White in Light Mode)
  - **Accents:** Emerald/Mint for Net Worth & Profits, Champagne Gold for High Value Assets, Sapphire Blue for Cash/Bonds, Violet for Equity/Startups, Amber for Crypto.
  - **Typography:** Modern, legible sans-serif (Inter/Geist/Poppins) with clean tabular numbers (`font-mono` / tabular-nums) for currency readability.
- **Micro-Interactions:** Subtle card borders with hover glowing states, smooth transitions, instant responsive drill-downs.

---

## 2. Key Screen States

### State 1: Upload & Staging Area
- **Hero Header:** "Private Wealth & Asset Aggregator" + badge *"100% Stateless & In-Memory Privacy"*.
- **Drag & Drop Zone:**
  - Support multi-format: PDF, PNG, JPG, JPEG.
  - File queue chips showing file name, file size, format icon, and delete button.
  - Privacy indicator checklist: *"No database storage", "Client-side encrypted", "Zero AI training on your data"*.
  - Primary Action Button: *"Analisis Semua Dokumen"* (dengan animasi loading saat diklik).

### State 2: Processing & Extraction
- Skeleton loading cards with dynamic status ticker:
  - Step 1: Pre-processing & compressing files
  - Step 2: Gemini 3.8 Flash multimodal parsing
  - Step 3: Running client-side mathematical aggregation

### State 3: Interactive Wealth Dashboard
1. **Top Control Bar:**
   - App branding
   - Privacy status: *"Data tersimpan lokal di browser"*
   - Action buttons: *"Tambah Dokumen"*, *"Ekspor Laporan (PDF)"*, *"Hapus Data"*
2. **Hero Metric (Net Worth Overview):**
   - **Total Net Worth (Kekayaan Bersih)** dalam format IDR besar & mudah dibaca (misal: `Rp 42.850.000.000`).
   - Sub-metrics: Total Aset, Total Liabilitas, Rasio Likuiditas.
3. **Executive Summary Card:**
   - Ringkasan naratif eksekutif yang rapi dan ringkas.
   - Poin-poin temuan penting (Key Highlights) dari portofolio.
4. **Asset Allocation & Categories:**
   - **Interactive Recharts Donut / Pie Chart:** Distribusi persentase per kategori aset dengan hover tooltip interaktif.
   - **Category Summary Cards:**
     - Saham Publik (`SAHAM`)
     - Kepemilikan Bisnis / Startup (`PERUSAHAAN_SENDIRI`)
     - Aset Kripto (`CRYPTO`)
     - Real Estate & Properti (`PROPERTI`)
     - Kas & Deposito (`KAS_DEPOSITO`)
     - Aset Koleksi / Lainnya (`LAINNYA`)
5. **Drill-Down Detail Interaction:**
   - Ketika pengguna mengklik kartu kategori (misal: "Saham") atau irisan Donut Chart, terbuka tampilan detail (Modal atau Tab view) yang menampilkan tabel aset individual:
     - Nama Aset & Institusi
     - Jumlah / Volume
     - Nilai Buku / Nilai Pasar (IDR)
     - **Badge Sumber File (`source_file`)**: Menampilkan dokumen asal angka tersebut diekstrak.
6. **Exportable PDF Report:**
   - Satu klik tombol "Export PDF" mencetak ringkasan portofolio terstruktur siap cetak untuk keperluan rapat keluarga/direksi atau arsip pribadi.
