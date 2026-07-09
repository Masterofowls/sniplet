#!/usr/bin/env bash
# Local release script (Linux/macOS)
set -euo pipefail

[[ $# -ge 1 ]] || { echo "Usage: $0 v0.1.0" >&2; exit 1; }
TAG="$1"
VERSION="${TAG#v}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RELEASE_DIR="dist/release"
RELEASE_APK="$RELEASE_DIR/{{APP_SLUG}}-${VERSION}.apk"

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  npm run verify
  bash scripts/android-build.sh aarch64
fi

mkdir -p "$RELEASE_DIR"
for candidate in \
  src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release.apk \
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
do
  if [[ -f "$candidate" ]]; then
    cp "$candidate" "$RELEASE_APK"
    break
  fi
done

[[ -f "$RELEASE_APK" ]] || { echo "APK not found" >&2; exit 1; }

if command -v apksigner >/dev/null 2>&1; then
  apksigner verify --verbose "$RELEASE_APK"
fi

( cd "$RELEASE_DIR" && sha256sum "$(basename "$RELEASE_APK")" > SHA256SUMS.txt )

gh release create "$TAG" "$RELEASE_APK" "$RELEASE_DIR/SHA256SUMS.txt" \
  --title "{{APP_NAME}} $TAG" --generate-notes

echo "Release published: $RELEASE_APK"
