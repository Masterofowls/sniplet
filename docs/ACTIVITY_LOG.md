# Activity Log

## 2026-07-08

- Scaffolded Tauri v2 + React TypeScript project with Android init
- Implemented Rust snippet CRUD, clipboard, GitHub OAuth device flow + Gist sync
- Built React UI: adaptive cards, syntax highlighting, quick import/copy, GitHub sync panel
- Added Biome lint/format, Vitest unit tests, APK build scripts and Gradle tuning
- Verified lint, typecheck, tests (7 passing), frontend build
- Built unsigned APK: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`
- Added `scripts/android-build.ps1` for rustup+NDK PATH fix on Windows
- Fixed GitHub auth HTTP error on Android: moved OAuth/sync to `@tauri-apps/plugin-http` with native TLS roots; added `VITE_GITHUB_CLIENT_ID` to `.env`
- Added GitHub Actions CI (`ci.yml`) and Release (`release.yml`) workflows, `docs/RELEASE.md`, `CHANGELOG.md`, and cross-platform build scripts
- Fixed broken Android APK install: copy jniLibs symlinks before packaging, default arm64 build, disabled R8 minify, apksigner verify step
- Moved snippet CRUD, import/export, merge, clipboard to React (`snippetStorage.ts`, `clipboard.ts`); Rust backend is plugins-only
- Switched releases to local build + `gh release` upload (`scripts/release.ps1`); CI release workflow verifies only
- Bumped version to `0.1.1` (`versionCode` 10001)
- Fixed `release.ps1` SHA256 on shells without `Get-FileHash`; published `v0.1.1` to GitHub Releases
- Replaced GitHub OAuth with manual PAT auth in GitHub Sync panel
