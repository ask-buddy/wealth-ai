# Implementation Roadmap & Verification Plan

## 1. Required Packages & Tooling

Pastikan library yang dibutuhkan terpasang:
- **Google Gen AI SDK:** `@google/genai` (official latest SDK)
- **Visualization:** `recharts` (kompatibel dengan React 19 / Next.js 16)
- **PDF Export:** `react-to-print` atau `jspdf` & `html2canvas`
- **Utilities:** `canvas-confetti` (opsional untuk perayaan saat analisis selesai), `zod` untuk schema validation

```bash
npm install @google/genai recharts react-to-print zod
```

---

## 2. Phase-by-Phase Roadmap

### Phase 1: Environment & SDK Foundation
- [x] Buat file `.env.local` untuk menyimpan `GEMINI_API_KEY` dan `GEMINI_BASE_URL` (mengarah ke 9router `http://localhost:2208/v1`).
- [x] Install library yang diperlukan (`@google/genai`, `recharts`, `react-to-print`, `zod`).
- [x] Buat file `src/types/wealth.ts` untuk model data TypeScript yang lengkap.
- [x] Buat helper `src/lib/gemini.ts` dan schema validator di `src/lib/schema.ts` terhubung ke 9router.


### Phase 2: Stateless API Route (`/api/analyze`)
- [ ] Buat `src/app/api/analyze/route.ts` dengan Next.js App Router POST handler.
- [ ] Implementasikan validasi payload input (Base64 file buffer, mimeType, fileName).
- [ ] Susun interleaved prompt dengan label nama file untuk melacak sumber dokumen (`sourceFile`).
- [ ] Panggil Gemini 3.8 Flash menggunakan `@google/genai` dengan parameter `responseMimeType: "application/json"` dan `responseSchema`.
- [ ] Error handling & response formatting.

### Phase 3: Client Math Engine & Local Storage
- [ ] Buat `src/lib/math.ts`: fungsi kalkulasi murni (Total Net Worth, agregasi kategori, persentase alokasi, sorting).
- [ ] Buat `src/lib/formatters.ts`: formatting IDR rupiah (`Intl.NumberFormat`), format tanggal, dan singkatan unit.
- [ ] Buat `src/lib/storage.ts`: load, save, dan clear data di browser `localStorage`.

### Phase 4: Upload & Preprocessing Components
- [ ] Buat `src/components/upload/dropzone.tsx`: drag & drop multi-format (`.pdf`, `.png`, `.jpg`, `.jpeg`).
- [ ] Buat helper kompresi gambar client-side untuk mempercepat pengiriman dan konversi Base64.
- [ ] Buat `src/components/upload/file-list.tsx`: daftar file yang di-upload dengan badge ukuran dan tombol hapus file.
- [ ] Integrasikan status indikator privasi ("Zero database, data tidak pernah disimpan").

### Phase 5: Interactive Dashboard & Visualizations
- [ ] Buat `src/components/dashboard/net-worth-hero.tsx`: kartu utama total kekayaan bersih dengan animasi angka.
- [ ] Buat `src/components/dashboard/executive-summary.tsx`: ringkasan eksekutif AI dan highlight aset.
- [ ] Buat `src/components/dashboard/asset-distribution-chart.tsx`: Donut chart interaktif menggunakan Recharts dengan custom tooltip.
- [ ] Buat `src/components/dashboard/category-cards.tsx`: grid kartu kategori dengan icon, persentase, dan total nilai.
- [ ] Buat `src/components/dashboard/asset-detail-drawer.tsx`: modal/drawer drill-down dengan daftar item per kategori beserta badge `source_file`.

### Phase 6: PDF Export & Reset Flow
- [ ] Buat komponen template laporan cetak di `src/components/export/printable-report.tsx`.
- [ ] Integrasikan tombol "Export PDF" yang langsung memicu dialog cetak/download PDF di browser.
- [ ] Tombol "Hapus Semua Data" untuk mereset `localStorage` dan kembali ke tampilan awal.

---

## 3. Verification & Testing Plan

1. **Automated / Build Verification:**
   - Jalankan `npm run build` untuk memverifikasi type-safety TypeScript dan keutuhan bundle Next.js.
   - Jalankan `npm run lint` untuk memastikan tidak ada linting error.

2. **Functional Verification (Manual & Browser Subagent):**
   - Upload sample file (gambar rekening/portofolio atau sample PDF).
   - Verifikasi bahwa API `/api/analyze` merespons dengan struktur JSON valid tanpa error.
   - Verifikasi bahwa kalkulasi total nilai dan persentase dihitung tepat oleh JS math engine.
   - Verifikasi interaksi klik kartu kategori memicu tampilan drill-down dengan rincian aset dan badge `source_file`.
   - Verifikasi fitur refresh browser tetap mempertahankan data (dari `localStorage`), dan tombol "Hapus Data" membersihkan seluruhnya.
   - Verifikasi fitur "Export PDF" menghasilkan layout laporan ringkas dan bersih.
