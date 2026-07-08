# Contributing

Thank you for contributing to Sniplet.

## Development setup

```bash
npm install
cp .env.example .env
npm run verify
```

See [README.md](README.md) for Android and OAuth setup.

## Pull requests

1. Fork and create a feature branch from `main`.
2. Run `npm run verify` before opening a PR.
3. CI must pass (lint, typecheck, tests, build, `cargo check`).
4. Keep changes focused; match existing code style (Biome).

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` tooling/deps
- `refactor:` code change without behavior change

## Releases

Maintainers: follow [docs/RELEASE.md](docs/RELEASE.md) for tagging and GitHub Actions releases.
