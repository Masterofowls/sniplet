# Sniplet

Advanced code snippet manager for Android (and desktop) built with **Tauri v2**, **React**, **TypeScript**, **MUI Material Design 3**, **Framer Motion**, and **Biome**.

## Features

- Syntax-highlighted snippet cards with adaptive grid/list layout
- Quick copy to clipboard (one tap)
- Quick import from clipboard or pasted text (with language detection)
- Search, tags, and favorites filtering
- GitHub OAuth device flow + private Gist sync (push/pull)
- Offline-first local JSON storage

## Stack note

Tauri Android uses a **WebView + React web** frontend. React Native Paper and Reanimated are React Native-only; this project uses **MUI (Material Design 3)** and **Framer Motion** for equivalent UX on the Tauri stack.

## Prerequisites

- Node.js 20+
- Rust stable + Android targets (installed via `npm run android:init`)
- Android SDK + NDK (via Android Studio or command-line tools)
- JDK 17+ (JDK 21 supported)
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` configured

## Setup

```bash
npm install
cp .env.example .env
# Set GITHUB_CLIENT_ID from https://github.com/settings/developers (OAuth App, enable device flow)
npm run android:init   # if not already initialized
```

### GitHub OAuth App

1. Create an OAuth App at https://github.com/settings/developers
2. Enable **Device Flow**
3. Set `GITHUB_CLIENT_ID` in `.env` or export before build:

```powershell
$env:GITHUB_CLIENT_ID = "your_client_id"
```

## Development

```bash
npm run dev              # Web only
npm run android:dev      # Android device/emulator
npm run verify           # lint + typecheck + test + build
```

## APK build (recommended settings)

Use these flags to reduce common Android build failures:

```bash
# Single-arch APK (faster, smaller) - recommended for sideload/testing
npm run android:build

# Universal APK (all ABIs)
npm run android:build:universal

# Split APK per architecture
npm run android:build:split
```

Output APK path:

```
src-tauri/gen/android/app/build/outputs/apk/aarch64/release/app-aarch64-release.apk
```

### Build error prevention checklist

| Setting | Value | Location |
|---------|-------|----------|
| minSdkVersion | 24 | `src-tauri/tauri.conf.json` |
| JVM heap | 4096m | `src-tauri/gen/android/gradle.properties` |
| AndroidX | enabled | `gradle.properties` |
| Target arch (CI/local) | `aarch64` | `package.json` android:build script |
| GitHub client ID | env at compile time | `GITHUB_CLIENT_ID` |

### Signed release APK

```bash
keytool -genkey -v -keystore sniplet-release.keystore -alias sniplet -keyalg RSA -keysize 2048 -validity 10000
```

Create `src-tauri/gen/android/keystore.properties`:

```properties
storePassword=YOUR_PASSWORD
password=YOUR_PASSWORD
keyAlias=sniplet
storeFile=../../../sniplet-release.keystore
```

Then configure signing in `src-tauri/gen/android/app/build.gradle.kts` per [Tauri Android signing docs](https://v2.tauri.app/distribute/sign/android/).

## Testing

```bash
npm run test
npm run lint
npm run typecheck
```

## License

MIT
