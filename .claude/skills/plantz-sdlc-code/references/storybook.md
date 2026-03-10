# Storybook & Chromatic Conventions

Shared story conventions for all domain modules. For `packages/components/` stories, see that package's own `CLAUDE.md` instead.

## Format

- Use CSF3 format with types from `storybook-react-rsbuild`.
- Local imports must include the `.tsx` or `.ts` file extension (e.g., `import { Foo } from "./Foo.tsx"`).
- Use the type annotation pattern: `export const Foo: Story = { ... };`

## Title Conventions

- Pages: `{Domain}/{ModulePascalCase}/Pages/{PageName}`. A **page** is a routed view rendered directly by a route definition.
- Components: `{Domain}/{ModulePascalCase}/Components/{ComponentName}`. Everything else is a **component**.

## Variant Coverage

Every story file must cover **every visually distinct state** the component can appear in. The goal is Chromatic regression coverage — if a code change could break a visual state, that state needs a story.

- One story per meaningful prop/state combination that produces a **visually different** rendering (e.g., `Selected`, `DueForWatering`, `Disabled`).
- Edge cases: empty/null/undefined optional fields (`MinimalFields`), long text that could overflow (`LongName`, `LongFieldValues`), boundary conditions (`DueToday`).
- For components with open/closed states (dialogs), include stories for both.
- Do **not** create stories for prop combinations that look identical — if `location="kitchen"` and `location="bathroom"` render the same layout, one story is sufficient.
- A page backed by runtime data (e.g., TanStack DB with auto-seeding) may have fewer variants if state can only be exercised via interaction. Document why in a comment.

## Story Patterns

- Callback props (event handlers) must have a no-op default in `meta.args` so stories render in isolation (e.g., `args: { onDelete: () => {} }`).
- Use a `make{Entity}(overrides)` factory function at the top of the story file to generate test data with sensible defaults. Override only the fields relevant to each story.
- Use decorators to constrain width when a component doesn't have intrinsic sizing (e.g., list items). Wrap in a `<div>` with a Tailwind width class.
- Use `args` for simple prop-driven stories. Use a `render` function when the component needs wrapping (providers, layout containers, or setup code).

## Chromatic Compatibility

Every story is automatically snapshotted by Chromatic — stories ARE the visual regression tests.

- Stories must render their meaningful visual state **without user interaction**. If a component requires a click to show content (e.g., a dialog), pass `open: true` in args so Chromatic captures the open state.
- Avoid animations or timers that could produce flaky snapshots.
- **Date-dependent stories must freeze `Date`.** If a story renders components that call `new Date()`, `Date.now()`, or date-comparison functions like `isDueForWatering()`, freeze the Date constructor in a decorator so snapshots are identical across runs. See `packages/plants-core/src/PlantListItem.stories.tsx` for the pattern: store `globalThis.Date`, replace it with a frozen version via `useRef` (so the initial render sees the fixed date), and restore in a cleanup effect.

## Isolation

- Stories must render without Squide runtime or React Router. If a component depends on these, extract a presentational sub-component that takes data via props and write stories for that instead.
- TanStack DB collections work in Storybook (they use localStorage). Components that read from collections will render with whatever data is in localStorage.

## Verification

Start the domain storybook, open it in a browser, and confirm every new story renders without errors. Never report a task as complete based on `lint` alone — it does not catch runtime rendering failures or broken imports that only surface in the browser. Always stop the dev server when verification is complete — never leave it running.

### Stopping dev servers

```bash
# Linux:
kill -9 $(lsof -ti :6006) 2>/dev/null

# Windows:
netstat -ano | grep :6006 | grep LISTENING
taskkill //PID <PID> //T //F
```
