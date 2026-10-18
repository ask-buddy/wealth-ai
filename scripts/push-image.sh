#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 3 || -z "$1" ]]; then
  echo "Usage: bash scripts/push-image.sh PROJECT_ID [REGION] [TAG]" >&2
  exit 1
fi

for tool in gcloud docker; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Required command not found: $tool" >&2
    exit 1
  fi
done

project_id="$1"
region="${2:-asia-southeast2}"
tag="${3:-latest}"
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
image="$region-docker.pkg.dev/$project_id/angelwealth/app:$tag"

gcloud auth configure-docker "$region-docker.pkg.dev" --quiet
docker buildx build --platform linux/amd64 --tag "$image" --push "$project_root"
gcloud run deploy angelwealth \
  --project "$project_id" \
  --region "$region" \
  --image "$image" \
  --port 8080 \
  --memory 1Gi \
  --timeout 300 \
  --allow-unauthenticated \
  --ingress all \
  --quiet
printf '\nDeployed image: %s\n' "$image"
