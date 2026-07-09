# Changelog

All notable changes to Sniplet are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-07-09

### Changed

- GitHub sync uses manual personal access token instead of OAuth device flow

## [0.1.1] - 2026-07-08

### Fixed

- Android APK install failure ("package is broken") via jniLibs symlink copy and arm64-only release builds

### Changed

- App logic moved from Rust to React (storage, clipboard, GitHub sync)
- Rust backend reduced to Tauri plugins only
- Releases built locally and uploaded with `npm run release -- vX.Y.Z`
- GitHub Actions release workflow verifies only (no APK build in CI)

## [0.1.0] - 2026-07-08

### Added

- Tauri v2 Android app with React + TypeScript + MUI
- Syntax-highlighted adaptive snippet cards
- Quick copy and quick import (clipboard / paste)
- Search, tags, and favorites
- GitHub OAuth device flow and private Gist sync
- Biome lint/format and Vitest unit tests
- Signed APK build and local keystore setup

[Unreleased]: https://github.com/YOUR_USERNAME/sniplet/compare/v0.1.1...HEAD
[Unreleased]: https://github.com/YOUR_USERNAME/sniplet/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/YOUR_USERNAME/sniplet/releases/tag/v0.1.2
[0.1.1]: https://github.com/YOUR_USERNAME/sniplet/releases/tag/v0.1.1
[0.1.0]: https://github.com/YOUR_USERNAME/sniplet/releases/tag/v0.1.0
