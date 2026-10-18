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
            'if "--flags-file" in command:\n'
            '    flags_path = Path(command[command.index("--flags-file") + 1])\n'
            '    assert flags_path.stat().st_mode & 0o777 == 0o600\n'
            '    Path(os.environ["FLAGS_LOG"]).write_text(flags_path.read_text())\n'
            'with open(os.environ["CALL_LOG"], "a") as f: f.write(json.dumps(command)+"\\n")\n'
            'sys.exit(7 if os.environ.get("FAIL_STEP") == " ".join(command[:3]) else 0)\n'
        )
        mock.chmod(0o755)
    log = temporary / "calls.jsonl"
    env = {**os.environ, "PATH": f"{temporary}:{os.environ['PATH']}", "CALL_LOG": str(log), "FLAGS_LOG": str(temporary / "flags.json"),
           "GEMINI_API_KEY": "test-key,with|symbols",
           "GEMINI_BASE_URL": "https://gateway.example/v1?x=a,b",
           "GEMINI_MODEL": "primary"}
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
    assert calls[2][calls[2].index("--memory") + 1] == "128Mi"
    assert calls[2][calls[2].index("--execution-environment") + 1] == "gen1"
    flags_path = Path(calls[2][calls[2].index("--flags-file") + 1])
    assert not flags_path.exists(), "temporary credentials were not cleaned up"
    flags = json.loads((temporary / "flags.json").read_text())
    assert flags == {
        "--update-env-vars": {"GEMINI_BASE_URL": env["GEMINI_BASE_URL"],
                              "GEMINI_MODEL": "primary", "GEMINI_API_KEY": env["GEMINI_API_KEY"]},
        "--remove-secrets": ["GEMINI_API_KEY"],
    }
    assert env["GEMINI_API_KEY"] not in log.read_text()
    assert env["GEMINI_API_KEY"] not in result.stdout + result.stderr
    result, calls = run("test-project", "us-central1", "v2")
    assert result.returncode == 0
    assert "us-central1-docker.pkg.dev/test-project/angelwealth/app:v2" in calls[1]
    assert run()[0].returncode != 0
    for name in ("GEMINI_BASE_URL", "GEMINI_MODEL", "GEMINI_API_KEY"):
        result, calls = run("test-project", **{name: ""})
        assert result.returncode != 0 and not calls, name
    for step, count in (("gcloud auth configure-docker", 1), ("docker buildx build", 2), ("gcloud run deploy", 3)):
        result, calls = run("test-project", FAIL_STEP=step)
        assert result.returncode == 7 and len(calls) == count, (step, result, calls)
        if step == "gcloud run deploy":
            assert not Path(calls[-1][calls[-1].index("--flags-file") + 1]).exists()
print("PASS: local build/push/deploy, defaults, overrides, and stop on failure")
