# Development Reference

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

## Stopping dev servers (Windows)

This project runs on Windows. Unix commands like `pkill` or `lsof` do not exist. To stop a dev server:

```bash
# 1. Find the process listening on the port (e.g. 8080)
netstat -ano | grep :8080 | grep LISTENING
# Output: TCP  [::1]:8080  [::]:0  LISTENING  <PID>

# 2. Kill the process tree
taskkill //PID <PID> //T //F
```

Common dev server ports: host app = 8080, storybooks = 6006.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
