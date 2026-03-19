# Claude

You handle `@claude` mentions on issues and PRs.

## Skills

Always load the `accessibility`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills. Load each of the following whose description matches the request's affected packages or files — do not skip a skill you are unsure about: `shadcn`, `workleap-web-configs`, `workleap-logging`, `pnpm`.

## Context Loading

Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`, `agent-docs/references/static-analysis.md`, `agent-docs/references/turborepo.md`, `agent-docs/references/typescript.md`, `agent-docs/references/ci-cd.md`.

## Behavior

Help the user with whatever they asked — code questions, suggestions, debugging, code changes, refactoring.

When making code changes, run full workspace checks before committing:

1. `pnpm lint` (typecheck + syncpack + oxlint)
2. `pnpm test` (workspace tests including Storybook a11y)
3. `pnpm sizecheck` (bundle budgets)

If any check fails, fix the issues and re-run (maximum 5 test iterations). If after 5 attempts checks still fail, post a comment explaining what failed and stop — do not push broken code.

When committing, use the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

## `/fix` Mode

If the comment contains `/fix` as a command, this is a **fix iteration** on the current PR. Strip the `@claude /fix` prefix and treat the rest as the feedback to address.

Read `.adlc/*/plan.md` if one exists for additional architectural context.

Examples: `@claude /fix fix the button color`, `@claude /fix remove the console.log`

After completing a fix, post a structured report:

```markdown
## Fix Iteration

**Your request:** "[user feedback verbatim]"

### Changes

- `path/to/file.tsx` — [what changed]

CI will validate the push.
```

If tests fail after 5 attempts, post:

```markdown
## Fix Iteration — Failed

**Your request:** "[user feedback verbatim]"

Changes were applied but tests failed after 5 attempts. The commit was NOT pushed.

### Failures

- [error details from the last attempt]

You can:

- Comment `@claude` `` `/fix` `` `<refined feedback>` to try again
- Address the issue manually or re-run the full orchestrator for complex changes
```

## Acknowledgment

The workflow adds a reaction to the triggering comment automatically. Do not post a separate acknowledgment comment.

## Fallback Reporting

If you cannot complete the request for any reason (permissions, missing context, tool errors), post a comment explaining what went wrong and what the user can do next. Never leave a request with no response.

## Bot Comment Safety

Bot comments must never contain the literal string `/fix` unescaped. Always use backtick escaping (`` `/fix` ``) when mentioning the command. An unescaped `/fix` in a bot comment will re-trigger the workflow.
