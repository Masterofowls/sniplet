#!/usr/bin/env bash
# {{APP_NAME}} Android APK build script (Linux/macOS)
set -euo pipefail

TARGET="${1:-aarch64}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env | sed 's/\r$//' | sed 's/^/export /')
  set +a
fi

export PATH="${HOME}/.cargo/bin:${PATH}"

ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${HOME}/Android/Sdk}}"
export ANDROID_HOME="$ANDROID_SDK"
export ANDROID_SDK_ROOT="$ANDROID_SDK"

if [[ ! -d "$ANDROID_HOME/ndk" ]]; then
  echo "Android NDK not found under $ANDROID_HOME/ndk" >&2
  exit 1
fi

NDK_DIR="$(find "$ANDROID_HOME/ndk" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n1)"
export NDK_HOME="$NDK_DIR"

case "$(uname -s)" in
  Linux*) LLVM_BIN="$NDK_DIR/toolchains/llvm/prebuilt/linux-x86_64/bin" ;;
  Darwin*) LLVM_BIN="$NDK_DIR/toolchains/llvm/prebuilt/darwin-x86_64/bin" ;;
  *) echo "Unsupported OS" >&2; exit 1 ;;
esac

export PATH="$LLVM_BIN:$PATH"

if [[ ! -f src-tauri/gen/android/app/build.gradle.kts ]]; then
  bash scripts/patch-android.sh
fi

case "$TARGET" in
  aarch64) npm run tauri android build -- --apk --target aarch64 ;;
  universal) npm run tauri android build -- --apk ;;
  split) npm run tauri android build -- --apk --split-per-abi ;;
  *) echo "Unknown target: $TARGET" >&2; exit 1 ;;
esac

echo ""
echo "APK output: src-tauri/gen/android/app/build/outputs/apk/"
