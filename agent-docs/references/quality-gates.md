# Quality Gates — UI Tasks

> Every UI task must pass these gates before it can be declared complete.

## Visual Verification

Never declare a UI task complete based on `typecheck` or `lint` alone — those tools
do not catch visual regressions. A browser must render the change and a human (or
agent with browser access) must confirm it looks correct.

- Components with stories — open the relevant domain Storybook and inspect visually.
- Host-level features — start the dev server (`pnpm dev`) and inspect in the browser.
- Never skip dark mode — verify both light and dark. See `references/color-mode.md`.

## Accessibility Minimums

Never ship UI that fails these checks:

- **Contrast:** all text and interactive elements must meet WCAG AA ratio (4.5:1 normal
  text, 3:1 large text / UI components). Never rely on color alone to convey state.
- **Keyboard navigation:** every interactive element must be reachable and operable via
  keyboard. Never create mouse-only interactions.
- **ARIA labels:** icon-only buttons and inputs without visible labels must have
  `aria-label` or `aria-labelledby`. Never leave unlabelled interactive elements.

## Definition of Done

A UI task is done when **all** of the following are true:

1. Code compiles (`typecheck` passes).
2. Lint passes (`lint` passes).
3. Visual verification completed in both light and dark mode.
4. Accessibility minimums above are met.
5. No regressions in existing components touched by the change.

Never mark a task complete if any gate above is unverified.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
