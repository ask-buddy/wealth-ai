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

### Build and deploy from a self-hosted runner

The runner needs Docker with Buildx, a running Docker daemon, and the Google Cloud
CLI already authenticated. The script uses that existing identity; it does not
perform an interactive login or configure federation.

One-time setup (with billing enabled and sufficient administrator permissions):

```bash
PROJECT_ID="your-project-id"
REGION="asia-southeast2"

gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project "$PROJECT_ID"
gcloud artifacts repositories create angelwealth --repository-format=docker --location "$REGION" --project "$PROJECT_ID"
```

Skip repository creation if it already exists. The runner identity needs Artifact
Registry Writer on the repository, Cloud Run deployment permissions, and Service
Account User on the Cloud Run runtime service account. The runtime service account
needs Secret Manager Secret Accessor on the existing `gemini-api-key` secret.

Build, push, and deploy:

```bash
bash scripts/push-image.sh your-project-id
# Optional region and image tag (use the commit SHA in CI):
bash scripts/push-image.sh your-project-id asia-southeast2 v1
```

The script configures Docker's credential helper using the existing `gcloud`
identity, builds locally for `linux/amd64` (including on Apple Silicon), pushes to
`REGION-docker.pkg.dev/PROJECT_ID/angelwealth/app:TAG`, and deploys the
`angelwealth` Cloud Run service. Each step must succeed before the next runs.
It does not use Cloud Build. See Google's [container build guidance](https://docs.cloud.google.com/run/docs/building/containers)
and [Cloud Run deployment guidance](https://docs.cloud.google.com/run/docs/deploying).

The service allows public unauthenticated access with ingress from all sources,
uses port 8080, 1 GiB memory, and a 300-second
request timeout. Existing environment variables and secret references are
preserved. The script does not load `.env` files; `.dockerignore` excludes them
from the build.

On the first deployment, configure the runtime settings before using the app
(replace the gateway and model values):

```bash
gcloud run services update angelwealth \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --update-env-vars "GEMINI_BASE_URL=https://your-gateway.example/v1,GEMINI_MODEL=your-model,GEMINI_FALLBACK_MODEL=your-fallback-model" \
  --update-secrets "GEMINI_API_KEY=gemini-api-key:latest"
```

Set `GEMINI_BASE_URL` to a stable gateway reachable from Cloud Run; `localhost`
would point inside the container. Override all AI settings above because the
application currently has development defaults in `src/server/ai/config.ts`.
The existing embedded key should be rotated if it is a real credential.

The runner identity also needs `run.services.setIamPolicy` permission to grant
public access. Organization policies must allow the `allUsers` IAM binding.
See [Cloud Run public access](https://docs.cloud.google.com/run/docs/authenticating/public).
Public access includes the application's API routes.

To get the public service URL:

```bash
gcloud run services describe angelwealth --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)'
```

Offline script checks: `python3 scripts/test-push-image.py`.

### GitHub Actions production deployment

`.github/workflows/deploy-prod.yml` deploys only when a pull request targeting
`release/prod` is merged. Closing a pull request without merging skips deployment;
direct pushes and manual dispatch do not trigger it. The job checks out the merge
commit and uses its SHA as the image tag. It uses the GitHub environment named `prod` and a
self-hosted runner. Add these **environment secrets** in GitHub:

- `GCP_PROJECT_ID`: your Google Cloud project ID.
- `GCP_REGION`: for example, `asia-southeast2`.

The workflow installs the Google Cloud CLI using `google-github-actions/setup-gcloud`.
The runner must already have Docker/Buildx and Google Cloud credentials available
to its service user. Installing the CLI does not authenticate it. No authentication
action or service account key is added.
The commit SHA becomes the image tag, and production deployments run one at a
time. Environment protection rules configured on `prod` still apply.

Application configuration stays on Cloud Run as described above. GitHub secrets
named `GEMINI_*` are not automatically copied to Cloud Run; the API key remains
in GCP Secret Manager as `gemini-api-key`.

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
