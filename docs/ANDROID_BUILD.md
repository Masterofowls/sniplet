# Android APK Build Guide

## Prerequisites

- Android SDK + NDK (API 24+)
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` set
- JDK 17+
- Rust Android targets: `rustup target add aarch64-linux-android`

## Recommended build commands

```bash
# Fastest: single architecture (most phones)
npm run android:build

# All ABIs in one APK
npm run android:build:universal

# Separate APK per CPU architecture
npm run android:build:split
```

## Error prevention settings

| Issue | Fix |
|-------|-----|
| OOM during Gradle | `org.gradle.jvmargs=-Xmx4096m` in `gradle.properties` |
| AndroidX errors | `android.useAndroidX=true` + `android.enableJetifier=true` |
| Wrong bundle ID path | Match `tauri.conf.json > identifier` with Android package; re-run `tauri android init` after ID changes |
| Unsigned APK won't install | Configure keystore per Tauri signing docs |
| Missing Rust target | `rustup target add aarch64-linux-android` |
| CLI arg passthrough | Use `tauri android build --apk --target aarch64` (no extra `--`) |

## After changing bundle identifier

```powershell
Remove-Item -Recurse -Force src-tauri\gen\android
npm run tauri android init
# Re-copy infra/android/gradle.properties.snippet values into gradle.properties
```

## Output paths

- aarch64: `src-tauri/gen/android/app/build/outputs/apk/aarch64/release/`
- universal: `src-tauri/gen/android/app/build/outputs/apk/universal/release/`

## GitHub sync

No build-time GitHub credentials are required. Users paste a personal access token in the app (**GitHub Sync** panel). Create a classic token with the **gist** scope at https://github.com/settings/tokens
