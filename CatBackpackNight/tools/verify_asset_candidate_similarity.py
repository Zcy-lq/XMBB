from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BATCH_PATH = PROJECT_ROOT / "assets" / "configs" / "asset_generation_batch_p0.json"
QUALITY_PATH = PROJECT_ROOT / "assets" / "configs" / "runtime_asset_quality.json"

HASH_SIMILARITY_LIMIT = 0.985
FORBIDDEN_METADATA_TERMS = (
    "screenshot",
    "qa_",
    "contact_sheet",
    "reference",
    "mockup",
    "debug",
)


def normalize(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def average_hash(path: Path, size: int = 16) -> str:
    with Image.open(path) as image:
        gray = image.convert("RGBA")
        # Composite transparent sprites over white so alpha-only differences do not hide copied art.
        background = Image.new("RGBA", gray.size, (255, 255, 255, 255))
        background.alpha_composite(gray)
        pixels = background.convert("L").resize((size, size), Image.Resampling.LANCZOS)
    if hasattr(pixels, "get_flattened_data"):
        values = list(pixels.get_flattened_data())
    else:
        values = list(pixels.getdata())
    threshold = sum(values) / len(values)
    return "".join("1" if value >= threshold else "0" for value in values)


def hash_similarity(left: str, right: str) -> float:
    if len(left) != len(right):
        return 0.0
    distance = sum(1 for a, b in zip(left, right) if a != b)
    return 1.0 - distance / len(left)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def is_development_png(path: Path) -> bool:
    rel = normalize(path).lower()
    if "/_sources/" in rel:
        return False
    if rel.startswith("assets/textures/references/"):
        return True
    if rel.startswith("tmp/qa_"):
        return True
    if "contact_sheet" in rel or "screenshot" in rel:
        return True
    return False


def metadata_terms(path: Path) -> list[str]:
    with Image.open(path) as image:
        text = " ".join(f"{key}={value}" for key, value in image.info.items()).lower()
    return [term for term in FORBIDDEN_METADATA_TERMS if term in text]


def main() -> int:
    failures: list[str] = []
    warnings: list[str] = []

    if not BATCH_PATH.exists():
        failures.append(f"Missing {normalize(BATCH_PATH)}")
    if not QUALITY_PATH.exists():
        failures.append(f"Missing {normalize(QUALITY_PATH)}")
    if failures:
        for failure in failures:
            print(f"[asset-candidate-similarity] FAIL {failure}", file=sys.stderr)
        return 1

    batch = read_json(BATCH_PATH)
    quality = read_json(QUALITY_PATH)
    tasks = batch.get("tasks", [])
    task_candidate_paths = [PROJECT_ROOT / task["candidatePath"] for task in tasks]
    existing_candidates = [path for path in task_candidate_paths if path.exists()]

    development_pngs = [
        path
        for path in PROJECT_ROOT.rglob("*.png")
        if is_development_png(path)
    ]

    test_name_patterns = tuple(str(pattern).lower() for pattern in quality.get("pathPolicy", {}).get("testFileNamePatterns", []))
    candidate_shas = {path: sha256_file(path) for path in existing_candidates}
    development_shas = {path: sha256_file(path) for path in development_pngs}
    candidate_hashes: dict[Path, str] = {}
    development_hashes: dict[Path, str] = {}

    for candidate in existing_candidates:
        candidate_name = candidate.name.lower()
        if any(pattern in candidate_name for pattern in test_name_patterns):
            failures.append(f"Candidate file name looks like a test artifact: {normalize(candidate)}")

        terms = metadata_terms(candidate)
        if terms:
            failures.append(f"Candidate PNG metadata contains development-only terms {terms}: {normalize(candidate)}")

        candidate_hashes[candidate] = average_hash(candidate)

    for dev_png in development_pngs:
        development_hashes[dev_png] = average_hash(dev_png)

    for candidate, candidate_sha in candidate_shas.items():
        for dev_png, dev_sha in development_shas.items():
            if candidate_sha == dev_sha:
                failures.append(f"Candidate is byte-identical to development image: {normalize(candidate)} == {normalize(dev_png)}")
                continue

            similarity = hash_similarity(candidate_hashes[candidate], development_hashes[dev_png])
            if similarity >= HASH_SIMILARITY_LIMIT:
                failures.append(
                    f"Candidate is visually too similar to development image ({similarity:.3f}): "
                    f"{normalize(candidate)} ~= {normalize(dev_png)}"
                )
            elif similarity >= 0.95:
                warnings.append(
                    f"High but allowed visual similarity ({similarity:.3f}): {normalize(candidate)} ~= {normalize(dev_png)}"
                )

    for warning in warnings:
        print(f"[asset-candidate-similarity] WARN {warning}")

    if failures:
        for failure in failures:
            print(f"[asset-candidate-similarity] FAIL {failure}", file=sys.stderr)
        return 1

    print(
        "[asset-candidate-similarity] "
        + json.dumps(
            {
                "candidates": len(existing_candidates),
                "developmentPngs": len(development_pngs),
                "warnings": len(warnings),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
