# {{APP_NAME}}

Blank **Tauri v2 + React** mobile template with minimal Rust, reusable MUI components, and Android APK build tooling.

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19, TypeScript, MUI, Framer Motion |
| State | Zustand + `plugin-store` |
| Native | Tauri plugins: HTTP, clipboard, store, opener |
| Rust | ~10 lines (plugin init only) |
| Mobile | Android WebView APK |

## Prerequisites

- Node.js 20+
- Rust stable (`rustup`) + Android targets
- Android SDK + NDK (Android Studio or CLI)
- JDK 17+ (21 recommended)
- `ANDROID_HOME` / `ANDROID_SDK_ROOT`

Install Rust Android targets once:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## Quick start

```bash
npm install
npm run android:init      # generates src-tauri/gen/android (first time)
npm run android:patch     # signing + jni symlink fix overlay
npm run verify            # lint, test, typecheck, build
```

### Web dev

```bash
npm run dev
```

### Android dev (device/emulator)

```bash
npm run android:dev
```

## Build APK

```powershell
# Windows — recommended arm64 sideload APK
npm run android:build

# Universal APK (all ABIs)
npm run android:build:universal
```

```bash
# Linux/macOS
npm run android:build:ci
npm run android:patch:unix   # instead of android:patch on Unix
```

Output:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

Install:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

## Signed release APK

See [infra/android/SIGNING.md](infra/android/SIGNING.md).

```powershell
npm run android:build
```

## GitHub release

```powershell
npm run release -- v0.1.0
npm run release -- v0.1.0 -SkipBuild   # upload existing APK only
```

Requires [GitHub CLI](https://cli.github.com/) (`gh auth login`).

## Project layout

```
src/
  components/     # Reusable UI (AppShell, dialogs, empty/loading states)
  hooks/          # useToast, useResponsiveLayout
  lib/            # platform, storage, http, clipboard
  pages/          # HomePage starter — replace with your screens
  store/          # appStore.ts — extend with your domain state
  theme/          # MUI theme
src-tauri/
  src/lib.rs      # Minimal Rust — plugins only
  tauri.conf.json # App id, version, Android minSdk/versionCode
  capabilities/   # Tauri permissions (HTTP allowlist, store, clipboard)
scripts/
  patch-android.* # Apply APK build overlay after android:init
  android-build.* # Build signed APK (PATH fixes for Windows)
  release.*       # Local gh release upload
android-overlay/  # Gradle signing + jni symlink fix
```

## Customize

See [docs/CUSTOMIZE.md](docs/CUSTOMIZE.md) for renaming, icons, permissions, and adding features.

See [docs/BUILD.md](docs/BUILD.md) for detailed build troubleshooting.

## Rust — what you need to know

You **do not** write app logic in Rust. Only touch Rust when adding a new Tauri plugin:

```rust
// src-tauri/src/lib.rs
.plugin(tauri_plugin_your_plugin::init())
```

Everything else stays in TypeScript.

## License

MIT
