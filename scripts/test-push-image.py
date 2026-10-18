"""Offline check: python3 scripts/test-push-image.py"""
import json
import os
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
script = root / "scripts/push-image.sh"
with tempfile.TemporaryDirectory() as directory:
    temporary = Path(directory)
    for name in ("gcloud", "docker"):
        mock = temporary / name
        mock.write_text(
            '#!/usr/bin/env python3\n'
            'import json, os, sys\n'
            'from pathlib import Path\n'
            'command = [Path(sys.argv[0]).name, *sys.argv[1:]]\n'
            'with open(os.environ["CALL_LOG"], "a") as f: f.write(json.dumps(command)+"\\n")\n'
            'sys.exit(7 if os.environ.get("FAIL_STEP") == " ".join(command[:3]) else 0)\n'
        )
        mock.chmod(0o755)
    log = temporary / "calls.jsonl"
    env = {**os.environ, "PATH": f"{temporary}:{os.environ['PATH']}", "CALL_LOG": str(log)}
    def run(*args, **overrides):
        log.write_text("")
        result = subprocess.run(["bash", str(script), *args], cwd=temporary,
                                env={**env, **overrides}, capture_output=True, text=True)
        return result, [json.loads(line) for line in log.read_text().splitlines()]

    result, calls = run("test-project")
    assert result.returncode == 0, result.stderr
    image = "asia-southeast2-docker.pkg.dev/test-project/angelwealth/app:latest"
    assert calls[0] == ["gcloud", "auth", "configure-docker", "asia-southeast2-docker.pkg.dev", "--quiet"]
    assert calls[1] == ["docker", "buildx", "build", "--platform", "linux/amd64", "--tag", image, "--push", str(root)]
    assert calls[2][:4] == ["gcloud", "run", "deploy", "angelwealth"]
    assert calls[2][calls[2].index("--image") + 1] == image
    assert calls[2][calls[2].index("--project") + 1] == "test-project"
    assert "--allow-unauthenticated" in calls[2]
    assert calls[2][calls[2].index("--ingress") + 1] == "all"
    assert "--set-env-vars" not in calls[2] and "--set-secrets" not in calls[2]
    result, calls = run("test-project", "us-central1", "v2")
    assert result.returncode == 0
    assert "us-central1-docker.pkg.dev/test-project/angelwealth/app:v2" in calls[1]
    assert run()[0].returncode != 0
    for step, count in (("gcloud auth configure-docker", 1), ("docker buildx build", 2), ("gcloud run deploy", 3)):
        result, calls = run("test-project", FAIL_STEP=step)
        assert result.returncode == 7 and len(calls) == count, (step, result, calls)
print("PASS: local build/push/deploy, defaults, overrides, and stop on failure")
