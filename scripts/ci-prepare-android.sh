#!/usr/bin/env bash
# Prepare Android project for CI/release (Linux/macOS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GRADLE_PROPS="src-tauri/gen/android/gradle.properties"
KEYSTORE_PATH="infra/android/sniplet-release.keystore"
KEYSTORE_PROPS="src-tauri/gen/android/keystore.properties"

echo "==> Ensuring Android project exists"
if [[ ! -f src-tauri/gen/android/app/build.gradle.kts ]]; then
  npm run tauri android init
fi

echo "==> Writing Gradle properties"
cat > "$GRADLE_PROPS" <<'EOF'
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
android.nonTransitiveRClass=true
android.nonFinalResIds=false
android.javaCompile.suppressSourceTargetDeprecationWarning=true
EOF

echo "==> Configuring release signing (when secrets present)"
mkdir -p infra/android

if [[ -n "${ANDROID_KEYSTORE_BASE64:-}" ]]; then
  echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > "$KEYSTORE_PATH"
fi

if [[ -f "$KEYSTORE_PATH" && -n "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  cat > "$KEYSTORE_PROPS" <<EOF
storePassword=${ANDROID_KEYSTORE_PASSWORD}
password=${ANDROID_KEYSTORE_PASSWORD}
keyAlias=${ANDROID_KEY_ALIAS:-sniplet}
storeFile=../../../../infra/android/sniplet-release.keystore
EOF
  echo "Release signing configured."
else
  echo "No keystore secrets — release APK may be unsigned."
  rm -f "$KEYSTORE_PROPS"
fi

echo "==> Android CI prep complete"
