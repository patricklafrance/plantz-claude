# Syncpack

Configuration in `.syncpackrc.js`.

## Semver groups

| Packages | Dependency types | Range | Policy |
|---|---|---|---|
| `@modules/*`, `@packages/*` | prod, peer | `^` | Caret for flexibility |
| `@modules/*`, `@packages/*` | dev | (pinned) | Pin devDependencies |
| `@apps/*` | prod, dev | (pinned) | Pin everything |
| `workspace-root` | dev | (pinned) | Pin devDependencies |

## Version groups

All packages must converge on a single version per dependency (`highestSemver` strategy).

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
