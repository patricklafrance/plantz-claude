<!-- This file is auto-injected when working in packages/components/.
     It owns ALL component-authoring rules: style, deps, stories, verification.
     shadcn CLI *explanations* (why bugs happen) live in agent-docs/references/shadcn.md.
     Generic shadcn knowledge (composition, forms, component selection) lives in the shadcn agent skill.
     Do not duplicate content from those sources here — one-liner reminders at the point of use are fine,
     full explanations and code blocks are not. Duplicated rules drift. -->

## Scope Rules

Never add devDependencies, scripts, or tooling that is not directly required by the current task. Adding a component does not justify adding linters, formatters, or other tooling — those changes require a separate task.

Before adding any dependency, run `pnpm ls <package> -r` to find the version already used in the workspace. Never guess version numbers. After any `package.json` change, run `pnpm syncpack lint` and fix every mismatch before proceeding.

## Code Style

All code in this package must use **semicolons** at the end of statements. The `shadcn add` CLI generates code without semicolons — normalize the output to include semicolons before committing. Match the style in `src/lib/utils.ts` and `src/index.ts`.

## Component Stories

Every component under `src/components/ui/` must have a co-located `.stories.tsx` file (e.g., `button.tsx` → `button.stories.tsx`).

### Requirements

- Cover **all variants** exposed by the component's CVA config with individual named stories.
- Icon-only sizes (`icon`, `icon-xs`, `icon-sm`, `icon-lg`) must use an icon child, not text.
- Icons inside `Button` must use `data-icon="inline-start"` or `data-icon="inline-end"` — never manual margin (`mr-2`) or size (`size-4`) classes.
- Include an `AllVariants` matrix story that renders every variant × size combination for visual regression.
- Use CSF3 format with types from `storybook-react-rsbuild`, following the pattern in `button.stories.tsx`.
- Title convention: `Components/{ComponentName}` (e.g., `Components/Button`).

## After adding a shadcn component

This is the complete workflow. Do not skip steps or consider the task done after only some steps.

1. Run `pnpm dlx shadcn@latest add <component>` from `packages/components/`.
2. **Move files** from the literal `@/` directory the CLI creates into `src/` (the alias doesn't resolve in this Rslib package).
3. **Fix imports** — replace `@/lib/utils` with relative paths using `.ts` extensions (e.g., `../../lib/utils.ts`). Fix any `@base-ui/react/*` imports the CLI mangled into `@/components/ui/*`. Use `pnpm dlx shadcn@latest add <component> --view <file>` to see correct upstream imports. See [shadcn reference](../../agent-docs/references/shadcn.md) for why these bugs happen.
4. **Normalize semicolons** to match the project convention (see Code Style above).
5. **Create the `.stories.tsx` file** next to the component in `src/components/ui/` (see Requirements above).
6. **Export the component** from `src/index.ts`.
7. **Visually verify** — start packages-storybook (`pnpm dev-packages-storybook`), open it in a browser, and confirm every new story renders without errors. Never report the task as complete based on `typecheck` alone — type-checking does not catch runtime rendering failures, missing CSS, or broken imports that only surface in the browser.
