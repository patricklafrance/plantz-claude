# Quality Gates — UI Tasks

> Every UI task must pass these gates before it can be declared complete.

## Visual Verification

Never declare a UI task complete based on `typecheck` or `lint` alone — those tools
do not catch visual regressions. A browser must render the change and a human (or
agent with browser access) must confirm it looks correct.

- Components with stories — open the relevant domain Storybook and inspect visually.
- Host-level features — start the dev server (`pnpm dev`) and inspect in the browser.
- Never skip dark mode — verify both light and dark. See `references/color-mode.md`.

## Accessibility Minimums (WCAG AA)

Never ship UI that fails these checks — inaccessible UI breaks the app for
keyboard and screen-reader users.

### Interactive elements

- **Icon-only buttons:** Never create a button containing only an icon without
  `aria-label`. Screen readers announce nothing without it.
  - Bad: `<Button size="icon"><Trash2 /></Button>`
  - Good: `<Button size="icon" aria-label="Delete plant"><Trash2 /></Button>`
- **Form labels:** Never render `<Checkbox>`, `<Select>`, `<Switch>`, or `<Input>`
  without a visible `<Label>` associated via `htmlFor`/`id`, or an `aria-label` on
  the trigger. Unlabelled controls are invisible to assistive technology.
- **Form errors:** Never display a validation error without both `aria-invalid="true"`
  on the control and `aria-describedby` pointing to the error message element.
  Add `role="alert"` to the error so screen readers announce it.

### Visual communication

- **Contrast:** All text and interactive elements must meet WCAG AA ratio (4.5:1
  normal text, 3:1 large text / UI components).
- **Color-only indicators:** Never rely solely on color to convey status. Always
  include `sr-only` text or an icon with `aria-label` so the information is
  available without color perception.
  - Bad: red background only for "due for watering"
  - Good: red background + icon + `<span className="sr-only">Due for watering</span>`

### Dynamic content

- **Live regions:** Never update visible content dynamically (counts, status
  messages, save confirmations) without a live region (`role="status"` or
  `aria-live="polite"`). Screen readers do not announce changes outside focus.

### Structure

- **Semantic lists:** Never render a visual list of items without semantic markup
  (`<ul>`/`<li>` or `role="list"`/`role="listitem"`). Screen readers announce item
  count and position only for semantic lists.
- **Keyboard navigation:** Every interactive element must be reachable and operable
  via keyboard. Never create mouse-only interactions.

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
