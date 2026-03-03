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

All commands are defined in the root `package.json`.

### Development

| Command | Description |
|---|---|
| `pnpm dev-host` | Start the Squide host (all modules) |
| `pnpm dev-management-plants` | Start host with only `management/plants` module |
| `pnpm dev-today-landing-page` | Start host with only `today/landing-page` module |
| `pnpm dev-management-storybook` | Start management domain Storybook |
| `pnpm dev-today-storybook` | Start today domain Storybook |
| `pnpm dev-packages-storybook` | Start packages Storybook |
| `pnpm dev-storybook` | Start combined Storybook (all domains) |

### Build and serve

| Command | Description |
|---|---|
| `pnpm build-host` | Production build of the host app |
| `pnpm build-storybook` | Build all Storybooks |
| `pnpm serve-host` | Serve the built host app |
| `pnpm serve-storybook` | Serve the built Storybooks |

### Quality

| Command | Description |
|---|---|
| `pnpm lint` | Run all linting (typecheck + syncpack) |
| `pnpm typecheck` | Run tsgo type checking |
| `pnpm syncpack` | Run syncpack lint for dependency version consistency |

### Maintenance

| Command | Description |
|---|---|
| `pnpm clean` | Remove dist, storybook-static, .turbo, and caches |
| `pnpm reset` | Full reset: clean + delete node_modules + pnpm-lock.yaml |
| `pnpm list-outdated-deps` | List outdated dependencies across the workspace |
| `pnpm update-outdated-deps` | Update all deps to latest + fix peer versions via syncpack |

## MODULES env var

Controls selective module loading during development. Set to a module's path under `apps/`:

```bash
cross-env MODULES=management/plants pnpm dev-host
```

Omit to load all modules.

## onlyBuiltDependencies

The `pnpm-workspace.yaml` allowlists native packages that require build steps: `@parcel/watcher`, `core-js`, `esbuild`, `netlify-cli`, `protobufjs`, `sharp`, `unix-dgram`.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
