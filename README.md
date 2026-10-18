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

## Deploy to Google Cloud Run

This repository is one Next.js application: React pages and TypeScript API routes
in `src/app/api`. There is no Python backend to deploy separately.

The Dockerfile builds the application, removes development dependencies, and runs
it as a non-root user on `0.0.0.0:$PORT` (default `8080`).

### Test locally

Create `.env.local` with your real gateway settings, then run:

```bash
docker build -t angelwealth .
docker run --rm -p 8080:8080 --env-file .env.local angelwealth
```

Open http://localhost:8080. Environment files and `document_test` are excluded
from the Docker build context. Dependencies and Google Fonts require network
access during the build.

### Build and deploy

With billing enabled and the Google Cloud CLI authenticated, replace the project
and gateway values below. Use an existing Secret Manager secret named
`gemini-api-key` containing your gateway API key.

```bash
PROJECT_ID="your-project-id"
REGION="asia-southeast2"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/angelwealth/app:latest"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project "$PROJECT_ID"
gcloud artifacts repositories create angelwealth --repository-format=docker --location "$REGION" --project "$PROJECT_ID"
gcloud builds submit --tag "$IMAGE" --project "$PROJECT_ID" .

gcloud run deploy angelwealth \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$IMAGE" \
  --port 8080 \
  --memory 1Gi \
  --timeout 300 \
  --no-allow-unauthenticated \
  --set-env-vars "GEMINI_BASE_URL=https://your-gateway.example/v1,GEMINI_MODEL=your-model,GEMINI_FALLBACK_MODEL=your-fallback-model" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"
```

Skip repository creation if it already exists. Grant the Cloud Run runtime service
account `roles/secretmanager.secretAccessor` on the API key secret before deploying.
Cloud Build also needs permission to push to the Artifact Registry repository.
The service is private by default; use `gcloud run services proxy angelwealth
--project "$PROJECT_ID" --region "$REGION"` to access it locally.

Set `GEMINI_BASE_URL` to a stable gateway reachable from Cloud Run; `localhost`
would point inside the container. Override all AI settings above because the
application currently has development defaults in `src/server/ai/config.ts`.
The existing embedded key should be rotated if it is a real credential.

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
