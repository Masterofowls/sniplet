#!/usr/bin/env bash
# Sniplet local release script (Linux/macOS)
# Builds a signed arm64 APK locally and publishes a GitHub Release for the tag.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 v0.1.0" >&2
  exit 1
fi

TAG="$1"
if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "Tag must look like v0.1.0 (got: $TAG)" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${TAG#v}"

echo "==> Verifying project"
npm run verify

echo "==> Building signed arm64 APK"
bash scripts/android-build.sh aarch64

APK_SRC=""
for candidate in \
  "src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release.apk" \
  "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk" \
  "src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release-unsigned.apk" \
  "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
do
  if [[ -f "$candidate" ]]; then
    APK_SRC="$candidate"
    break
  fi
done

if [[ -z "$APK_SRC" ]]; then
  echo "Release APK not found" >&2
  exit 1
fi

mkdir -p dist/release
RELEASE_APK="dist/release/sniplet-${VERSION}-arm64.apk"
cp "$APK_SRC" "$RELEASE_APK"

if command -v apksigner >/dev/null 2>&1; then
  echo "==> Verifying APK signature"
  apksigner verify --verbose "$RELEASE_APK"
fi

(
  cd dist/release
  sha256sum "$(basename "$RELEASE_APK")" > SHA256SUMS.txt
)

NOTES_ARGS=()
if [[ -f CHANGELOG.md ]]; then
  NOTES_ARGS=(--notes-file CHANGELOG.md)
fi

echo "==> Creating GitHub release $TAG"
gh release create "$TAG" \
  "$RELEASE_APK" \
  dist/release/SHA256SUMS.txt \
  --title "Sniplet $TAG" \
  --generate-notes \
  "${NOTES_ARGS[@]}"

echo ""
echo "Release published:"
echo "  Tag: $TAG"
echo "  APK: $RELEASE_APK"
