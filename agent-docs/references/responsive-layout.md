# Responsive Layout

> Every user-facing feature must render correctly on phone, tablet, and desktop screens.

## Breakpoints

Use Tailwind responsive prefixes to adapt layout across screen sizes. Do not hardcode
pixel values in components — the breakpoints are defined by Tailwind's theme defaults.
If the repo customizes them, the `@theme` block in
`packages/components/src/styles/globals.css` is the single source of truth.

Minimum layout tiers:

| Tier    | Tailwind prefix | Behavior                          |
| ------- | --------------- | --------------------------------- |
| Phone   | _(default)_     | Single-column, stacked layout     |
| Tablet  | `md:`           | Intermediate — adapt where needed |
| Desktop | `lg:`           | Multi-column or expanded layout   |

Design mobile-first: the base (unprefixed) styles target the narrowest viewport,
then layer on `md:` and `lg:` overrides for wider screens.

## Rules

Never build a layout that only works at desktop width. A layout that overflows or
hides controls on smaller screens is a broken layout.

- **Bad:** `className="flex gap-4"` (stays horizontal and overflows on narrow screens)
- **Good:** `className="flex flex-col md:flex-row gap-4"`

- **Bad:** `className="grid grid-cols-3 gap-6"` (three columns on phone is unusable)
- **Good:** `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"`

## Verification

Before completing a UI task, open the component's stories in the relevant domain
Storybook and resize the browser (or use the viewport addon if available) to phone,
tablet, and desktop widths. Confirm no horizontal scrollbar appears, no content is
truncated, and all interactive elements remain visible and reachable.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
