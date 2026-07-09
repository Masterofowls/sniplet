# Sniplet

Advanced code snippet manager for Android (and desktop) built with **Tauri v2**, **React**, **TypeScript**, **MUI Material Design 3**, **Framer Motion**, and **Biome**.

## Features

- Syntax-highlighted snippet cards with adaptive grid/list layout
- Quick copy to clipboard (one tap)
- Quick import from clipboard or pasted text (with language detection)
- Search, tags, and favorites filtering
- GitHub personal access token + private Gist sync (push/pull)
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
npm run android:init   # if not already initialized
```

### GitHub sync

1. In the app, open **GitHub Sync**
2. Create a [classic personal access token](https://github.com/settings/tokens/new?scopes=gist&description=Sniplet) with the **gist** scope
3. Paste the token and tap **Connect**

No OAuth app or build-time GitHub credentials are required.

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
| **Release** | `.github/workflows/release.yml` | Verify on tag `v*.*.*` (APK built locally) |

Badge (replace `YOUR_USERNAME/sniplet`):

```markdown
![CI](https://github.com/YOUR_USERNAME/sniplet/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/YOUR_USERNAME/sniplet/actions/workflows/release.yml/badge.svg)
```

## Releases

Full release documentation: **[docs/RELEASE.md](docs/RELEASE.md)**

### Quick release

1. Update [CHANGELOG.md](CHANGELOG.md) and version in `src-tauri/tauri.conf.json`
2. Tag, build, and publish locally:

```powershell
npm run release -- v0.1.2
```

See **[docs/RELEASE.md](docs/RELEASE.md)** for signing and keystore setup.

## License

MIT
