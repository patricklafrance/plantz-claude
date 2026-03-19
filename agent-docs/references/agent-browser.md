# agent-browser

CLI tool for browser automation, installed as a workspace devDependency. Load the `agent-browser` skill to learn the commands.

## When to use

After implementing UI changes — before reporting a task complete, verify that your changes render correctly in the browser. This applies to any agent writing UI code, not just ADLC skills.

You do NOT need agent-browser for:

- Pure backend/config/tooling changes
- Changes fully covered by lint, typecheck, or unit tests
- Story-only changes (Storybook a11y tests via `pnpm test` cover these)
