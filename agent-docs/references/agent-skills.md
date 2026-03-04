# Agent Skills Reference

## Skill directories

| Directory | Purpose | Editable? |
|---|---|---|
| `.agents/skills/` | General-purpose skills shared across repos (vitest, pnpm, turborepo, etc.) | No — read-only |
| `.claude/skills/` | Claude Code discovery layer. Contains symlinks to `.agents/skills/` and `agent-skills/` entries | No — symlinks only |
| `agent-skills/` | Project-specific skills authored in this repo | Yes |

Skills are automatically discovered by Claude Code from `.claude/skills/` based on the `SKILL.md` description field.

## Project-specific skills

| Skill | Path | Reference module |
|---|---|---|
| `scaffold-domain-module` | `agent-skills/scaffold-domain-module/SKILL.md` | `apps/management/plants/` |
| `scaffold-domain-storybook` | `agent-skills/scaffold-domain-storybook/SKILL.md` | `apps/management/storybook/` |
| `audit-agent-docs` | `agent-skills/audit-agent-docs/SKILL.md` | — |

### Reference modules

Some skills read a canonical module at execution time to derive dependencies, scripts, and config files. When modifying module-level tooling (adding a linter, changing a config file, adding a dependency), apply the change to the reference module first — future scaffolding picks it up automatically. If the change introduces a new file type the skill does not account for, update the skill's procedure.

## Reverse-pointer rule

When `git status` shows changes to a reference module listed above, open the corresponding skill and verify its procedure still matches the reference module's structure. A stale skill silently produces incomplete modules.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
