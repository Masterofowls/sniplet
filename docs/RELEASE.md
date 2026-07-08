# Release process

This document describes how to cut a Sniplet release locally and via GitHub Actions.

## Overview

| Workflow | Trigger | Output |
|----------|---------|--------|
| [CI](../.github/workflows/ci.yml) | Push/PR to `main` | Lint, tests, web build, `cargo check` |
| [Release](../.github/workflows/release.yml) | Tag `v*.*.*` or manual dispatch | Signed universal APK + GitHub Release |

## One-time repository setup

### 1. GitHub Actions secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Required | Description |
|--------|----------|-------------|
| `VITE_GITHUB_CLIENT_ID` | Yes | OAuth App Client ID (Device Flow enabled) |
| `ANDROID_KEYSTORE_BASE64` | Yes (signed release) | Base64-encoded `sniplet-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Yes (signed release) | Keystore + key password |
| `ANDROID_KEY_ALIAS` | No | Defaults to `sniplet` |

Encode keystore (Linux/macOS):

```bash
base64 -w0 infra/android/sniplet-release.keystore
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("infra/android/sniplet-release.keystore"))
```

### 2. OAuth app

See [README](../README.md#github-oauth-app). The release build embeds `VITE_GITHUB_CLIENT_ID` at compile time.

## Automated release (recommended)

### Tag-driven release

1. Update version in `package.json` and `src-tauri/tauri.conf.json` if needed.
2. Update [CHANGELOG.md](../CHANGELOG.md).
3. Commit and push to `main`.
4. Create and push a semver tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

5. GitHub Actions **Release** workflow will:
   - Run `npm run verify`
   - Build a universal signed APK on Ubuntu
   - Upload artifacts
   - Create a GitHub Release with APK + `SHA256SUMS.txt`

### Manual workflow dispatch

1. Go to **Actions → Release → Run workflow**
2. Enter version tag (e.g. `v0.1.1`)
3. Download APK from workflow artifacts (Release publish step runs only for tag pushes)

## Local release

### Prerequisites

Same as [README](../README.md): Node 22, Rust, JDK 21, Android SDK/NDK, signing keystore.

### Build signed APK (Windows)

```powershell
npm run verify
npm run android:build:universal
```

Output:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

### Build signed APK (Linux/macOS)

```bash
npm run verify
npm run android:build:ci
```

### Install on device

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

## Versioning

- **App version**: `src-tauri/tauri.conf.json` → `version`
- **Android versionCode**: `bundle.android.versionCode` (must increase for Play Store)
- **Git tag**: `vMAJOR.MINOR.PATCH` (triggers release workflow)

Example bump for `0.2.0`:

```json
// src-tauri/tauri.conf.json
"version": "0.2.0",
"bundle": {
  "android": {
    "versionCode": 10001
  }
}
```

## Release checklist

- [ ] `npm run verify` passes locally
- [ ] `CHANGELOG.md` updated
- [ ] Version bumped in `tauri.conf.json` / `package.json`
- [ ] GitHub Actions secrets configured
- [ ] Tag pushed (`v*.*.*`)
- [ ] Release APK installs on a physical device
- [ ] GitHub OAuth connect + Gist push/pull tested on device

## Troubleshooting CI

| Failure | Fix |
|---------|-----|
| NDK not found | Release workflow installs `ndk;27.2.12479018` via sdkmanager |
| Unsigned APK | Set `ANDROID_KEYSTORE_*` secrets; re-run release |
| GitHub auth broken in APK | Set `VITE_GITHUB_CLIENT_ID` secret; rebuild |
| `gen/android` missing | CI runs `tauri android init` automatically |
| Gradle OOM | `org.gradle.jvmargs=-Xmx4096m` in CI prep script |

## Artifact layout

```
dist/release/
├── sniplet-0.1.0-universal.apk
└── SHA256SUMS.txt
```
