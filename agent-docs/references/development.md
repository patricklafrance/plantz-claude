# Development Reference

## Runtime requirements

- **Node.js** >= 24.0.0 (enforced via `engines` in root `package.json`)
- **pnpm** 10.30.1 (enforced via `packageManager` in root `package.json`)

## Workspace topology

Defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/**
  - packages/**
```

## Commands

All commands are defined in the root `package.json` under `scripts`. Read that file to discover available commands — never duplicate the script list here, as it drifts from the source of truth.

Scripts follow a naming convention:

- `dev-*` — local development servers
- `build-*` / `serve-*` — production builds and serving
- `lint`, `typecheck`, `syncpack` — quality checks
- `clean`, `reset`, `*-outdated-*` — maintenance

## MODULES env var

See [ARCHITECTURE.md](../ARCHITECTURE.md#modules-env-var) for selective module loading via the `MODULES` env var.

## onlyBuiltDependencies

The `pnpm-workspace.yaml` allowlists native packages that require build steps: `@parcel/watcher`, `core-js`, `esbuild`, `netlify-cli`, `protobufjs`, `sharp`, `unix-dgram`.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
