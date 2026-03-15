# Storybook & Chromatic Conventions

Shared story conventions for all domain modules. For `packages/components/` stories, see that package's own `CLAUDE.md` instead.

## Format

- Use CSF3 format with types from `@storybook/react-vite`.
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
- A page backed by runtime data (e.g., MSW with default seed data) may have fewer variants if state can only be exercised via interaction. Document why in a comment.

## Story Patterns

- Callback props (event handlers) must have a no-op default in `meta.args` so stories render in isolation (e.g., `args: { onDelete: () => {} }`).
- Use a `make{Entity}(overrides)` factory function at the top of the story file to generate test data with sensible defaults. Override only the fields relevant to each story.
- Use decorators to constrain width when a component doesn't have intrinsic sizing (e.g., list items). Wrap in a `<div>` with a Tailwind width class.
- Use `args` for simple prop-driven stories. Use a `render` function when the component needs wrapping (providers, layout containers, or setup code).

## Chromatic Compatibility

Every story is automatically snapshotted by Chromatic — stories ARE the visual regression tests.

- Stories must render their meaningful visual state **without user interaction**. If a component requires a click to show content (e.g., a dialog), pass `open: true` in args so Chromatic captures the open state.
- Avoid animations or timers that could produce flaky snapshots.
- **Chromatic modes:** All domain story files (pages, components, dialogs) must set `parameters: { chromatic: { modes: { "light mobile": { theme: "light", viewport: 375 }, "light tablet": { theme: "light", viewport: 768 }, "light desktop": { theme: "light", viewport: 1280 }, "dark mobile": { theme: "dark", viewport: 375 }, "dark tablet": { theme: "dark", viewport: 768 }, "dark desktop": { theme: "dark", viewport: 1280 } } } }` in `meta` so Chromatic captures mobile, tablet, and desktop snapshots in both light and dark themes. Do NOT use legacy `chromatic.viewports` — it conflicts with the global `chromatic.modes` in preview.tsx. This does not apply to `packages/components/` primitive stories (they use the preview-level light/dark modes only).
- **Date-dependent stories must use deterministic data.** Never monkey-patch `globalThis.Date`. Instead, use extreme dates in story data so that date-comparison functions like `isDueForWatering()` return the same result regardless of when the snapshot runs: use far-past dates (e.g., `new Date(2020, 0, 1)`) for "due" plants and far-future dates (e.g., `new Date(2099, 0, 1)`) for "not due" plants. For components that display the current date (e.g., `CreatePlantDialog`), accept an optional prop to inject a fixed date and pass it from stories. See `packages/core-plants/src/PlantListItem.stories.tsx` for usage.

## Tailwind CSS Source Scanning

Each domain storybook's `.storybook/storybook.css` must include `@source` directives for every package whose components appear in that storybook's stories. At minimum, domain storybooks need:

- `@source` for `packages/components/src/**/*.{ts,tsx}` (shared UI primitives)
- `@source` for `packages/core-plants/src/**/*.{ts,tsx}` (shared domain components)
- `@source` for each domain module's `src/**/*.{ts,tsx}`

Without these directives, Tailwind will not generate utility classes used by those packages, causing unstyled components in Storybook and Chromatic snapshots.

## Isolation

- Stories must render without Squide runtime or React Router. If a component depends on these, extract a presentational sub-component that takes data via props and write stories for that instead.
- MSW is managed globally via `msw-storybook-addon` (`initialize()` + `mswLoader` in preview.tsx). Each domain module has a `storybook.setup.tsx` that imports `initializeFireflyForStorybook` + `withFireflyDecorator` from the domain storybook's `firefly.tsx` (e.g., `../../storybook/firefly.tsx`) and creates a `CollectionDecorator` providing a fresh `QueryClient` + collection context per story. Story files import `collectionDecorator` and `fireflyDecorator` from `./storybook.setup.tsx` and add both to `decorators: [collectionDecorator, fireflyDecorator]`. Per-story handler overrides are applied via `parameters.msw.handlers`.
- The packages storybook (`packages/storybook/`) does not need MSW, collections, or QueryClient since it only tests presentational components.
- Stories that need data use `parameters.msw.handlers` for per-story handler overrides. See `msw-tanstack-query.md` reference for the full pattern.

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
