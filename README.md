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
| GitHub client ID | build-time env | `VITE_GITHUB_CLIENT_ID` in `.env` / Actions secret |

### Signed release APK (local)

See **[docs/RELEASE.md](docs/RELEASE.md)** for keystore generation, CI secrets, and the full release checklist.

Quick local build:

```powershell
npm run android:build:universal   # Windows
npm run android:build:ci          # Linux/macOS / CI-compatible
```

Keystore path in `src-tauri/gen/android/keystore.properties`:

```properties
storeFile=../../../../infra/android/sniplet-release.keystore
```

Signing is configured in `src-tauri/gen/android/app/build.gradle.kts` (optional when keystore is absent).

## Testing

```bash
npm run test
npm run lint
npm run typecheck
npm run verify   # all of the above + production web build
```

## CI/CD

GitHub Actions run on every push/PR to `main`:

| Workflow | File | Purpose |
|----------|------|---------|
| **CI** | `.github/workflows/ci.yml` | Lint, typecheck, tests, Vite build, `cargo check` |
| **Release** | `.github/workflows/release.yml` | Signed universal APK + GitHub Release on tag `v*.*.*` |

Badge (replace `YOUR_USERNAME/sniplet`):

```markdown
![CI](https://github.com/YOUR_USERNAME/sniplet/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/YOUR_USERNAME/sniplet/actions/workflows/release.yml/badge.svg)
```

## Releases

Full release documentation: **[docs/RELEASE.md](docs/RELEASE.md)**

### Quick release

1. Update [CHANGELOG.md](CHANGELOG.md) and version in `src-tauri/tauri.conf.json`
2. Configure GitHub Actions secrets (see below)
3. Tag and push:

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. Download the signed APK from the GitHub Release page

### Required GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth Client ID for in-app sync |
| `ANDROID_KEYSTORE_BASE64` | Base64 release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (default: `sniplet`) |

### Local signed build

```powershell
# Windows
npm run android:build:universal
```

```bash
# Linux/macOS (CI-compatible)
npm run android:build:ci
```

Signed APK output:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

See [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md) and [infra/android/SIGNING.md](infra/android/SIGNING.md) for signing details.

## License

MIT
