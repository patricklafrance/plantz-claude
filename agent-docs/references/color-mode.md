# Color Mode

> Every user-facing feature must support light, dark, and system (OS-preference) modes.

## How it works

Dark mode is **class-based**: a `.dark` class is toggled on an ancestor element.
The custom variant is defined in `packages/components/src/styles/globals.css` as
`@custom-variant dark (&:is(.dark *))`. Theme tokens (CSS custom properties) swap
automatically between `:root` (light) and `.dark` (dark) blocks in the same file.

The app must expose a toggler with three options: **Light**, **Dark**, and **System**
(follows `prefers-color-scheme` via JavaScript, then applies the `.dark` class).

## Rules

Never use hardcoded color values in component classes — use the theme tokens from
`globals.css`. Hardcoded colors bypass the theme swap and break in dark mode.

- **Bad:** `className="bg-white text-gray-900 border-gray-200"`
- **Good:** `className="bg-background text-foreground border-border"`

When a component needs different values in dark mode beyond what the token swap
provides, use the `dark:` variant prefix. Never use raw
`@media (prefers-color-scheme: dark)` in component CSS — the `dark:` variant is
class-based in this repo, so a raw media query will desynchronize from the app's
color mode switcher.

- **Bad:** `@media (prefers-color-scheme: dark) { .card { background: #1a1a1a; } }`
- **Good:** `className="bg-muted dark:bg-input/30"`

## Token reference

The canonical list of theme tokens lives in
`packages/components/src/styles/globals.css` under the `@theme inline` block.
Do not duplicate the list elsewhere — open that file to see what is available.

## Verification

Never declare a color-mode-related task complete without visual confirmation in **both
light and dark mode**. `typecheck` alone does not catch color regressions.

**Where to verify:**

- Components with stories — open the relevant domain Storybook and toggle the color
  mode switcher.
- Host-level features (layout shell, nav, color mode toggle itself) — start the dev
  server (`pnpm dev`) and verify in the browser. The host app has no Storybook.

**What to check (both modes):**

- Text contrast against its background — never invisible or near-invisible text.
- Logo visibility — never a logo that vanishes or becomes unreadable.
- Border visibility — never borders that disappear into the background.
- Input fields — never input text or placeholders that blend into the field background.
- Dialog/sheet backdrops — never a raw white or raw black backdrop.
- No hardcoded `white`, `black`, `gray-*` classes leaking through.

Never skip any item above. If a single check fails, the task is not done.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
