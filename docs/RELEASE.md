# Release process

Sniplet releases are built **locally** and uploaded to GitHub Releases with a semver tag. CI only verifies code quality; it does not build APKs.

## Overview

| Workflow | Trigger | Output |
|----------|---------|--------|
| [CI](../.github/workflows/ci.yml) | Push/PR to `main` | Lint, tests, web build, `cargo check` |
| [Release](../.github/workflows/release.yml) | Tag `v*.*.*` | `npm run verify` + `cargo check` only |

## Local release (recommended)

### Prerequisites

- Node 22, Rust (rustup), JDK 21
- Android SDK + NDK
- Signing keystore at `infra/android/sniplet-release.keystore`
- `src-tauri/gen/android/keystore.properties` configured
- [GitHub CLI](https://cli.github.com/) (`gh`) authenticated
- `.env` with `VITE_GITHUB_CLIENT_ID`

### One-command release (Windows)

```powershell
npm run release -- -Tag v0.1.1
```

### One-command release (Linux/macOS)

```bash
npm run release:linux -- v0.1.1
```

This will:

1. Run `npm run verify`
2. Build a signed **arm64** APK (`npm run android:build`)
3. Verify the APK with `apksigner`
4. Create a GitHub Release and upload:
   - `dist/release/sniplet-<version>-arm64.apk`
   - `dist/release/SHA256SUMS.txt`

### Manual steps

```powershell
npm run verify
npm run android:build
gh release create v0.1.1 dist/release/sniplet-0.1.1-arm64.apk --title "Sniplet v0.1.1" --generate-notes
```

APK output:

```
src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release.apk
```

### Install on device

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release.apk
```

If install fails because a previous build used a different signature, uninstall first:

```bash
adb uninstall com.sniplet.mobile
```

## Versioning

- **App version**: `src-tauri/tauri.conf.json` → `version`
- **Android versionCode**: `bundle.android.versionCode` (increase for each Play/sideload update)
- **Git tag**: `vMAJOR.MINOR.PATCH`

Example bump for `0.2.0`:

```json
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
- [ ] `npm run release -- -Tag vX.Y.Z` succeeds
- [ ] APK installs on a physical arm64 device
- [ ] GitHub OAuth connect + Gist push/pull tested on device

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Package is broken" on install | Use arm64 APK from local build; uninstall old app first; ensure keystore signing is configured |
| Unsigned APK | Add `keystore.properties` and rebuild |
| GitHub auth broken in APK | Set `VITE_GITHUB_CLIENT_ID` in `.env` before build |
| `apksigner verify` fails | Rebuild with `npm run android:build`; check keystore paths |
| Windows symlink / corrupt APK | Gradle `fixJniSymlinks` task copies real `.so` files before packaging |

## Artifact layout

```
dist/release/
├── sniplet-0.1.0-arm64.apk
└── SHA256SUMS.txt
```
