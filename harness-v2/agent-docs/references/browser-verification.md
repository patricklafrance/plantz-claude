# Browser Verification

## When Triggered

The coordinator spawns a verification agent after each slice that has `[visual]` or `[interactive]` acceptance criteria. Slices with no such criteria skip verification entirely.

## Protocol

### 1. Read acceptance criteria

Read the slice file's Acceptance Criteria section. Each criterion is tagged `[visual]` or `[interactive]`.

### 2. Start dev server

Start the appropriate dev server:

| Target            | Command              | Port | URL                     |
| ----------------- | -------------------- | ---- | ----------------------- |
| Host app          | `pnpm dev-host`      | 8080 | `http://localhost:8080` |
| Unified storybook | `pnpm dev-storybook` | 6006 | `http://localhost:6006` |

Use the **unified storybook** for story-based verification (component variants, visual states). Use the **host app** for route-based verification (page navigation, login flows, cross-module interactions).

### 3. Verify [visual] criteria

For each `[visual]` criterion:

1. Navigate to the relevant story or page.
2. Take a screenshot.
3. Assess whether the criterion is met based on the screenshot.
4. Record pass/fail with evidence.

### 4. Verify [interactive] criteria

For each `[interactive]` criterion:

1. Take a **before** screenshot showing the initial state.
2. Perform the action (click, navigate, type, submit).
3. Take an **after** screenshot showing the result.
4. Assess the before/after difference against the criterion.
5. Record pass/fail with evidence.

### 5. Write results

Write verification results to `.harness/completed/{NN}/verification.md`, where `{NN}` matches the slice number.

### 6. Stop the dev server

Always stop the dev server when verification is complete:

```bash
# Linux:
kill -9 $(lsof -ti :8080) 2>/dev/null   # host
kill -9 $(lsof -ti :6006) 2>/dev/null   # storybook
# Windows:
netstat -ano | grep :<PORT> | grep LISTENING
taskkill //PID <PID> //T //F
```

## Retry on Failure

If a criterion fails, the coordinator resumes the coder agent with the verification report (max 3 fix attempts per slice). Between the coder's fix and the re-verification, wait 5 seconds for the dev server to pick up changes, then re-verify once.

## Dark Mode Verification

When a criterion requires dark mode verification:

1. Toggle the `dark` class on the `document.documentElement` element.
2. Wait 200ms for theme tokens to apply.
3. Take the screenshot.
4. Toggle the `dark` class back off when done.

## Viewport Consistency

Use a consistent viewport size for all screenshots within a verification run. This ensures visual criteria are assessed against a predictable layout. The default viewport should match the desktop Chromatic mode (1280px width).

## Host App Authentication

The host app requires login. Demo credentials: `alice@example.com` / `password`.

## Storybook URL Pattern

Stories are addressed by their kebab-cased title and story name:

```
http://localhost:6006/?path=/story/{kebab-title}--{story-name}
```

Example: a story with title `Management/Plants/Pages/PlantsPage` and export `Default` maps to:

```
http://localhost:6006/?path=/story/management-plants-pages-plantspage--default
```
