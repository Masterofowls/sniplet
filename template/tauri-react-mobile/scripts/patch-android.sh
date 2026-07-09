#!/usr/bin/env bash
# Apply Android APK build overlay (signing + jni symlink fix)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GRADLE_APP="src-tauri/gen/android/app/build.gradle.kts"
if [[ ! -f "$GRADLE_APP" ]]; then
  echo "Android project missing — running tauri android init"
  npm run tauri android init
fi

if [[ ! -f "$GRADLE_APP" ]]; then
  echo "Android project still missing at $GRADLE_APP" >&2
  exit 1
fi

cp "android-overlay/app/build.gradle.kts" "$GRADLE_APP"
echo "Applied android overlay"

cat > src-tauri/gen/android/gradle.properties <<'EOF'
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

echo "Wrote Gradle properties"
echo "Optional signing: see infra/android/SIGNING.md"
