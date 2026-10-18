#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 3 || -z "$1" ]]; then
  echo "Usage: bash scripts/push-image.sh PROJECT_ID [REGION] [TAG]" >&2
  exit 1
fi

for name in GEMINI_BASE_URL GEMINI_MODEL GEMINI_API_KEY; do
  if [[ -z "${!name:-}" ]]; then
    echo "Set $name to a non-empty value before deploying." >&2
    exit 1
  fi
done

for tool in gcloud docker python3; do
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
flags_file="$(mktemp)"
trap 'rm -f "$flags_file"' EXIT
python3 - "$flags_file" <<'PY'
import json
import os
import sys

with open(sys.argv[1], "w") as file:
    json.dump({
        "--update-env-vars": {name: os.environ[name] for name in (
            "GEMINI_BASE_URL", "GEMINI_MODEL", "GEMINI_API_KEY"
        )},
        "--remove-secrets": ["GEMINI_API_KEY"],
    }, file)
PY
gcloud run deploy angelwealth \
  --project "$project_id" \
  --region "$region" \
  --image "$image" \
  --port 8080 \
  --memory 128Mi \
  --execution-environment gen1 \
  --timeout 300 \
  --allow-unauthenticated \
  --ingress all \
  --flags-file "$flags_file" \
  --quiet
printf '\nDeployed image: %s\n' "$image"
