# Build guide

## First-time Android setup

1. Install [Android Studio](https://developer.android.com/studio) or command-line SDK + NDK
2. Set environment variable:
   - Windows: `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`
   - macOS/Linux: `ANDROID_HOME=$HOME/Android/Sdk`
3. From project root:

```bash
npm install
npm run android:init
npm run android:patch        # Windows
npm run android:patch:unix   # macOS/Linux
```

4. Replace icons in `src-tauri/icons/` (or run `npm run tauri icon path/to/logo.png`)

## Development commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite web dev server (:1420) |
| `npm run android:dev` | Run on connected device/emulator |
| `npm run verify` | Lint + typecheck + test + production build |
| `npm run android:build` | Release APK (Windows script) |

## APK variants

| Script | Output |
|--------|--------|
| `android:build` | arm64-first (falls back to universal) |
| `android:build:universal` | Single APK with all ABIs |
| `android:build:split` | One APK per ABI |

## Signing

Unsigned APKs may fail to install with “package is broken” on some devices.

1. Generate keystore — see [infra/android/SIGNING.md](../infra/android/SIGNING.md)
2. Copy `android-overlay/keystore.properties.example` → `src-tauri/gen/android/keystore.properties`
3. Rebuild: `npm run android:build`

## Android overlay (why it exists)

`npm run android:patch` copies `android-overlay/app/build.gradle.kts` which adds:

- **Release signing** from `keystore.properties`
- **`fixJniSymlinks`** — copies real `.so` files instead of Windows symlinks (fixes corrupt APK)
- **`isMinifyEnabled = false`** — safer for WebView/Tauri apps

Re-run `android:patch` after `tauri android init` if you regenerate the Android project.

## Version bumps

Edit `src-tauri/tauri.conf.json`:

```json
{
  "version": "0.2.0",
  "bundle": {
    "android": {
      "versionCode": 10001
    }
  }
}
```

`versionCode` must increase for each Play Store / sideload upgrade.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `rustup` / NDK not found (Windows) | Use `scripts/android-build.ps1` (fixes PATH) |
| Package is broken on install | Run `android:patch`, sign APK, uninstall old app first |
| HTTP fails on device | Add URL patterns in `src-tauri/capabilities/default.json` |
| `gen/android` missing | `npm run android:init` then `android:patch` |
| Gradle OOM | `gradle.properties` sets `-Xmx4096m` via patch script |

## Release workflow

```powershell
npm run verify
npm run android:build
npm run release -- v0.1.0
```

Artifacts land in `dist/release/demo-app-<version>.apk`.
