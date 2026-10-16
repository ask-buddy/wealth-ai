# AngelWealth | Private Wealth & Asset Aggregator AI

Aplikasi web intelijen portofolio kekayaan untuk **High-Net-Worth Individuals (HNWI)** berbasis **Next.js (App Router)** yang menghitung dan memetakan total kekayaan (*Net Worth*) secara instan dari dokumen finansial multi-format (*PDF laporan sekuritas, rekening koran, screenshot portofolio saham/kripto, sertifikat properti, akta perusahaan*).

Menggunakan arsitektur **Zero-Database & Local-First Privacy** dengan pemrosesan *in-memory* dan ekstraksi multimodal oleh model **Gemini 3.8 Flash** via **9router** gateway lokal.

---

## 🛠️ Konfigurasi Environment & 9router

Aplikasi ini terhubung ke **9router** lokal sebagai router/proxy API LLM.

### File `.env.local`
Konfigurasi file `.env.local` di root proyek:

```bash
# 9router Local Proxy Configuration
GEMINI_API_KEY=sk-ce72aa2310c36158-dsg15r-2de4b7b2
GEMINI_BASE_URL=http://localhost:2208/v1
GEMINI_MODEL=gemini-3.8-flash
```

| Variabel | Nilai Default | Deskripsi |
|---|---|---|
| `GEMINI_API_KEY` | `sk-ce72aa23...` | API key autentikasi 9router |
| `GEMINI_BASE_URL` | `http://localhost:2208/v1` | URL base endpoint proxy 9router lokal |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Model multimodal untuk ekstraksi terstruktur |

---

## 🚀 Memulai Aplikasi

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan development server**:
   ```bash
   npm run dev
   ```

3. **Buka aplikasi**:
   Akses [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## ✨ Fitur Utama

- **Zero-Database & In-Memory Privacy**: Tidak ada database server. Semua dokumen dan nominal diproses secara *stateless in-memory* dan disimpan di `localStorage` peramban pengguna.
- **Multimodal One-Shot Extraction**: Menganalisis dokumen PDF, JPG, JPEG, dan PNG sekaligus dengan interleaved prompting dan JSON Schema terstruktur.
- **Auditable Source Tracking**: Setiap aset dan liabilitas terikat dengan berkas asal (`sourceFile`) untuk memudahkan peninjauan.
- **Interactive Wealth Allocation**:
  - Donut Chart & Stacked Bar distribusi aset interaktif.
  - Drill-down rincian aset per kategori.
  - Pemisahan tab *Total Aset* dan *Liabilitas* yang berfungsi penuh.
- **Mode Privat (Stealth Mode)**: Tombol privasi untuk menyamarkan nilai nominal (`Rp ••••••••••`) seketika saat di tempat umum, dengan pintasan keyboard `P`.
- **Ekspor Laporan PDF**: Unduh ringkasan audit kekayaan bersih langsung dalam format cetak resmi.
