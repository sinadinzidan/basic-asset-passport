# Mandatory project conventions

Read this file before generating, editing, or reviewing project code.
Apply these rules to new and modified code. They take precedence over
conflicting generated template guidance in `AGENTS.md` or bundled skills.
Preserve unrelated behavior; do not perform unrequested migrations.

These conventions follow the team's `project-standard` repository
(frontend standards 01-06 and 08), adapted to Flows. Where Flows or Aura
guidance conflicts with a rule from that repository, Flows and Aura win and the
rule is left out. If a request conflicts with a convention, say so and ask
before deviating.

## Folder and file structure

- Folders are kebab-case at every level (`user-profile/`, never
  `UserProfile/`). `.tsx` files are PascalCase and `.ts` files are camelCase,
  each named after its main export (`UserProfile.tsx`, `formatUserName.ts`).
  `__tests__/` and `__mocks__/` folders are the folder exceptions.
- A file whose name a tool requires keeps it: configuration files such as
  `vite.config.ts` and `vite-env.d.ts`, and generated code. Add no other
  exception for convenience.
- Pages compose screens: `src/pages/dashboard/Dashboard.tsx`,
  `src/pages/dashboard/Settings.tsx`. A page file composes components; it must
  not define nested components or hold their markup. Pages outside the main
  flow (login, sign up, not found, permission denied) go in
  `src/pages/general/`, for example `src/pages/general/NotFound.tsx`.
- Page UI belongs in `src/components/`, in a folder path that mirrors the
  page's path, with a folder named after the page file in kebab-case:
  `src/pages/dashboard/Users.tsx` has its components in
  `src/components/dashboard/users/`. Nested sections are allowed, for example
  `src/components/dashboard/settings/UserList.tsx`.
- Genuinely shared UI (used by more than one page) belongs in
  `src/components/general/`, not miscellaneous feature-specific code.
- Providers (components that only supply a context or a store to their
  children) never go in `src/components/`. They live in
  `src/providers/<group>/`, with the group folder named as in
  `src/components/` (`general` for app-wide ones), for example
  `src/providers/general/NavigationProvider.tsx`; their tests sit in a
  `__tests__/` folder beside them. Other app-wide setup (routing, stores) belongs
  in `src/app/` once it exists.
- Use `src/hooks/<feature>/useAssetList.ts` for React queries and behavior,
  `src/services/<feature>/asset.ts` for SDK operations,
  `src/types/equipment.ts` for data contracts,
  `src/enums/equipmentHealth.ts` for shared domain enums, and
  `src/constants/dashboard.ts` for meaningful configuration.
- Keep mock datasets and reusable test factories in `src/__mocks__/`, separate
  from real services and UI, as the Flows template says.
- Mirror feature folders where helpful. Create folders only when needed;
  do not scaffold empty modules or introduce routing before it is required.
- Keep tests next to the code they cover, in a `__tests__/` folder inside the same
  folder: `src/components/assets/__tests__/UserList.test.tsx`,
  `src/services/assets/__tests__/asset.test.ts`. Test files import the
  code under test with `../`.

## Types, constants, enums and hooks: where they live

- Before declaring a type, constant, enum or hook, search the codebase for one
  that already exists and reuse it. If one is almost right, extend or adjust it;
  do not create a near-duplicate under another name. Say which one you reused.
- A declaration used by one component stays in that component's file. When a
  second place needs it, move it to the shared folder in the same change and
  update both imports. Do not export it from a component file for others to
  import.
- The shared folders (`src/types/`, `src/constants/`, `src/enums/`,
  `src/hooks/`) mirror `src/components/`: group folder, then page folder. Put the
  file at the lowest level that covers everything using it, for example
  `src/types/dashboard/users/userTable.ts` for the components of one page,
  `src/types/dashboard/` across a group, and the folder root across groups.
- Type, constant, enum and service files are named after what they hold
  (`user.ts`, `userTable.ts` in `types/`; `userTable.ts` in `constants/`;
  `userStatus.ts` in `enums/`; `user.ts` in `services/users/`), without a
  `Types`, `Constants`, `Enum` or `Service` suffix, since the folder already says
  so. Hook files are named after the hook (`useUserFilters.ts`).
- Code carries no comments, in any folder: not `//` notes, not `/** */` doc
  blocks. Only two kinds stay: directives a tool reads (`@ts-expect-error` and
  the like) and the Arrange / Act / Assert markers in longer tests. Name things
  so the code explains itself, and put the reasoning behind user-visible
  behavior in `SPEC.md`. Vendored code copied from a skill (`src/cognite-file-viewer/`)
  is left as it came.

## Naming

- Components and types use PascalCase: `UserList`, `AssetListResponse`.
  Do not prefix interfaces with `I`.
- Variables and functions use descriptive camelCase: `selectedEquipment`,
  `fetchAssets`, `formatAvailability`.
- Names are full words. No abbreviations such as `eq`, `usr`, `btn`, `cfg`,
  `idx`, `err`, `res`, `req`, or `resp`, and no single-letter names (`i`, `e`,
  `x`), including in loops and callbacks. Established technical terms such as
  `id`, `url`, `html`, `api`, `http`, `props` (in a component's props type, `AssetListProps`),
  and CDF are acceptable.
- Hooks start with `use`. Booleans start with `is`, `has`, `can`, `should`,
  `did`, or `will` and use the positive form: `isEnabled`, not `isNotDisabled`.
  This applies to variables, props, state, and return values.
- Event handlers use `handlePlantChange`; callback props use `onPlantChange`.

## Enums, constants, and types

- Use an enum for any value from a fixed set, with the TypeScript `enum`
  keyword. Do not use string or number unions or plain objects in its place.
  Types owned by a library (SDK, Aura props) are used as they are.
- Enum type names use PascalCase. Members AND string values must use
  UPPER_SNAKE_CASE, and the value equals the key. Do not use numeric enums.
- `erasableSyntaxOnly` must be `false` or absent in every tsconfig, because
  enums are not erasable syntax.

```ts
enum EquipmentHealth {
  HEALTHY = 'HEALTHY',
  ALERT = 'ALERT',
  DANGER = 'DANGER',
  BAD_DATA = 'BAD_DATA',
}

const ASSET_PAGE_SIZE = 25;
const QUERY_STALE_TIME_MS = 300_000;
```

- Avoid repeating raw status strings in UI logic.
- Preserve external API values; map to application enums at the service
  boundary only when needed. Reuse SDK types instead of duplicating them.
- Define explicit display labels using exhaustive `Record<Enum, string>`
  mappings; do not display raw enum values to users.
- No magic values. Name every meaningful number and string, in an
  UPPER_SNAKE_CASE constant in a `.ts` file, not inline in a component. This
  covers limits, thresholds, timeouts and business values (include units:
  `REFRESH_INTERVAL_MS`, `AVAILABILITY_THRESHOLD_PERCENT`), and also routes,
  storage keys, event names, API paths, user-facing messages, and any literal
  that is compared against.
- Do not extract every `0`, `1`, `-1`, empty string, index, or ordinary layout
  value or class name. Use theme tokens instead of hardcoded colors.
- Define props, service inputs, and domain contracts explicitly.
- No `any`, non-null assertions, or unsafe casts. Follow `AGENTS.md`'s stricter
  no-cast rule and its test-mock exception; use guards for unknown values.
- Use discriminated unions when they accurately express distinct states.
  Avoid duplicated derived information and unnecessarily complex types.

## React ordering, state, and effects

Write every component and hook body in this order, with **one blank line
between groups** and no blank lines inside a group:

1. Hooks first: context, external, query and custom hooks (`useContext`,
   `useCogniteSdk`, `useQueryClient`, `use...ViewModel`, `use...`).
2. State (`useState`, `useReducer`).
3. Refs (`useRef`).
4. Derived values and memoized calculations.
5. Event handlers and callbacks (`handle...`).
6. Effects (`useEffect`, `useLayoutEffect`), the last group before the return.
7. Conditional returns, then the main JSX `return`, after one blank line.

```tsx
export function AssetList({ page, search }: AssetListProps) {
  const { useAssetList } = useContext(AssetListViewModelContext);
  const { assets, isLoading } = useAssetList(page, search);

  const [isGridOpen, setIsGridOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const visibleAssets = assets.filter((asset) => asset.isVisible);

  function handleGridToggle(): void {
    setIsGridOpen((previous) => !previous);
  }

  useEffect(() => {
    containerRef.current?.focus();
  }, [isGridOpen]);

  if (isLoading) return <Loader />;

  return <AssetTable assets={visibleAssets} onToggle={handleGridToggle} />;
}
```

- All hooks, including effects, must precede every conditional return.
  Never call hooks conditionally, in loops, or inside callbacks.
- Keep each group together: do not scatter `useState` calls between handlers,
  or place an effect in the middle of the component.
- Keep effects near the return. Use effects only for external synchronization,
  not derived values or click handling. Keep dependencies complete and clean
  up subscriptions or obsolete asynchronous work.
- Derive values instead of copying them into state. Use TanStack Query for
  server data and the Flows host for shareable state, as in `AGENTS.md`.
- Transient state may remain local. Share state through context/storage when
  consumers must stay synchronized; do not add a store solely for isolated
  local state. This qualifies the template's blanket ViewModel state ban.
- A ViewModel that a single component calls holds its transient state with
  `useState` directly (`useAgentComposerViewModel`'s draft). Do not wrap
  `useState` in a `use<Name>State` hook only to keep it out of the ViewModel.
  When a second component needs the same state, move it to the shared store
  instead of calling the ViewModel twice.
- Client state that changes often and is read in several places lives in a
  Zustand store (Flows recommends it over context for that case), in
  `src/store/<name>.ts` when the whole app reads it (`navigation.ts`, `agents.ts`), or in a group folder like `src/hooks/` when one feature does. Make the store with `createStore` from
  `zustand/vanilla` and export one module-level instance for the app. Read it
  through a context whose default is that instance, so production needs no
  provider and a test supplies its own store with the state it needs. Read it
  through a `use<Name>State(selector)` hook that picks only the slice it needs,
  and keep a selector from returning a new object or array on each call.
- Add `useMemo` and `useCallback` only when required, for example for a
  dependency of an effect or a prop of a memoized child. Otherwise write a plain
  function or value.
- When a group grows large or reusable, extract it into a custom hook instead
  of lengthening the component.
- Do not pass props through components that do not use them. More than two
  levels counts as drilling (Flows flags it beyond three). Choose the lightest
  option that works, in this order: local state; composition (pass the finished
  element as `children` or a slot prop); context for values that rarely change
  and are read in many places; the shared storage layer for client state that
  changes often or is read across the view; the TanStack Query cache for server
  data, which is never copied into component state, context or a store. Say
  which option you chose.

## Components and CDF data access

- Keep pages focused on composition and components on clear responsibilities.
  Extract meaningful or reusable sections, not every JSX fragment.
- Reuse Aura controls and import them from individual component subpaths.
- Use consistent status labels, colors, and icons, accessible semantics,
  and responsive layouts without unnecessary visual effects.
- Dependency direction: page -> component -> query hook -> service -> CDF SDK.
- Presentation components must not construct clients or make network calls.
  Obtain the authenticated client through the existing Flows provider and
  inject it into services. Do not create hidden global clients.
- A value a provider supplies is read through its reader hook, called
  directly: `const { project, getAgent } = useAgentContext();`. The readers
  (`useAssetContext`, `useDocumentFileContext`, `useTimeseriesContext`,
  `useAgentContext`) throw outside their provider. The context is already the
  injection point, so never pass a reader through a per-hook deps context
  (`const { useAssetContext: useClient } = useContext(UseAssetsContext)`).
  A test supplies the value with the context's own provider
  (`<AssetContext.Provider value={makeMockClient()}>`).
- Keep a per-hook deps context (`Use<Name>Context`) only for what no provider
  supplies: service functions, clocks, timers, ID generators. Delete it when
  nothing is left in it. This narrows the React context pattern in
  `AGENTS.md` §3.
- Use host integration for project context and credentials. Never hardcode
  credentials, tokens, or deployment-specific runtime project context.
- Include project and relevant filters in query keys.
- Prefer small typed service functions. Interface/class services and
  ViewModel hooks are appropriate only when useful; they are not mandatory
  for every operation. This supersedes the template's blanket class and
  ViewModel requirements, without weakening dependency injection.
- Keep mocks separate from real CDF services. Do not add empty abstractions.
- Every list of an asset (notes, documents, existing files, timeseries,
  equipment, search matches) is read with a limit and sorted on the server,
  never sorted or cut in the browser. The service asks for one row more than
  it returns (`getRequestLimit`) and reports `hasMore` (`toLimitedList`), so
  "there are more" is known rather than guessed from a full page. A list the
  user can extend offers "Show more" (`ShowMoreButton` with `useListLimit`),
  which reads a longer list while the rows on screen stay; a list that cannot
  be extended says that it is cut short.
- A count is taken by the server (`countNodes`, an aggregate request), never
  by reading rows. The asset filters and the view property path each have one
  builder (`matchAssetRelation`, `matchAssetInList`, `toViewPropertyPath`);
  use them instead of writing the filter out again.
- The data-model lookup (`listAssetPassportViews`) is cached per client, so
  every service of one session shares one request; a failed lookup is not
  kept. Do not add a second cache or look the model up outside it.
- A dependency a single component needs injected for its tests, and that no
  provider supplies (the document viewer), sits in a context file beside that
  component (`documentViewerContext.ts`), not under `src/hooks/`.

## UI states, forms and layout

- Every component or page that loads or shows data handles all four states from
  the start, in this order: **loading** (never a blank area or stale content
  shown as ready), **error** (a clear message, never a silent failure),
  **retry** (the error state re-runs the failed request whenever it can be
  repeated), **empty** (never an empty table, list or blank area), then the
  data.
- An action that can fail (a form submit, a mutation) shows its failure, allows
  trying again, and keeps what the user entered.
- Loading, error, retry and empty states each come from one shared
  implementation, so they look and behave the same everywhere. Do not build a
  local version inside a page or component; change the shared one for everyone.
  If none exists yet, create it once as the shared version. State messages are
  named constants.
- An error state says why it failed: pass `reason={getErrorReason(error)}` to
  `RetryAlert`, so the message CDF gave shows under the hint. A hook or
  ViewModel that wraps a query exposes its `error` for this.
- A failed action is never a dead end. A failed load or count offers **Retry**
  through `RetryAlert` (a count that failed is not shown as a dash alone); a
  failed action on something the user already chose (an upload, a chat
  question) offers **Try again** or **Retry** that repeats it with the same
  input, without asking the user to choose or type it again.
- State messages (loading, error, empty, truncated and status texts, dialog
  titles and hints) live in `src/constants/<feature>.ts`. A message with a
  variable part is built by a small function in `src/lib/` (`assetMessage.ts`,
  `documentUploadMessage.ts`). Button labels, `aria-label`s and headings may
  stay inline in the component.
- A refetch in the background never replaces content that is already on
  screen: show skeletons or a loading notice only while there is no data yet
  (`isPending`), not on every `isFetching`.
- A dialog that leaves the page usable (the assistant's panel) is
  `role="dialog"` with `aria-modal="false"`, takes focus when the user opens
  it and gives focus back to its trigger when it closes. A text box that sends
  on Enter ignores the Enter that confirms a composed character
  (`event.nativeEvent.isComposing`).
- All forms look and behave the same: field layout, spacing, label position,
  input sizing, validation message style and button placement. Use the shared
  form components and do not style a field one-off.
- Show validation errors next to the field they belong to. Show a loading state
  on the submit action while submitting and prevent duplicate submits.
- A form is never cut off or clipped at any screen size: no fixed widths or
  heights that hide content, and fields wrap or stack on narrow screens.
- A page never scrolls horizontally at any screen width. A data table may scroll
  within its own region where Aura's table guidance allows it.

## UI consistency and quality

- The first pages built set the theme, layout and components. Every later page
  and component matches them in color, typography, spacing, layout structure and
  component choice. Look at the existing pages and components before building UI
  and name which you are matching.
- Reuse before creating. The same job (a table, a form, a dialog, a
  confirmation, a page header, a primary action) looks and behaves the same on
  every page. Create a new component only when nothing existing fits, and make
  it follow the same theme.
- Do not introduce a new layout, navigation pattern, color, font or spacing
  value on one page. If the reference must change, change it everywhere through
  the shared component.
- Quality bar: related items are grouped and unrelated ones separated; the most
  important information and action are the easiest to find; primary actions are
  prominent and consistently placed, and destructive ones are visually distinct;
  alignment and spacing follow one scale and nothing overlaps or overflows;
  interactive elements show hover, focus, active, disabled and loading states.
- Every input has a visible label; a placeholder is not a label.
- No console errors or warnings, broken layout, placeholder or lorem-ipsum
  content, or leftover debug UI.
- Where the app can be run, render the result at desktop and narrow widths and
  fix problems before reporting the work done. Report anything that could not be
  matched to the reference, and why, instead of silently diverging.

## Rendering, imports, and quality

- Every data section handles loading, error, empty, and success states as above.
  Errors must be readable and actionable; never turn failures into empty
  arrays or fabricated success. Do not expose secrets in errors.
- Use stable record identifiers as React keys.
- Follow ESLint import grouping and ordering. Use `import type` for types.
- Prefer named exports, retaining defaults required by existing tooling.
  Avoid unnecessary barrels, circular imports, or new path aliases.
- Never store tokens or credentials in `localStorage`, `sessionStorage` or any
  place script can read; get them from the host. Never use
  `dangerouslySetInnerHTML` with user data. Keep `manifest.json` network
  permissions as narrow as the app needs, since they define its Content
  Security Policy.
- Test user-visible behavior, loading, empty results, failures, and important
  interactions. Mock external CDF boundaries; never call live services in tests.
- Follow existing test-first guidance, keep related documentation current,
  and avoid unrelated refactoring or unnecessary dependencies.

## Toolchain and tooling

- Node is at least 24.0.0 and npm at least 11.3.0. Enforce it in `package.json`
  `engines` (a stricter range from the Flows template may stay, but a floor is
  never lowered), `engine-strict=true` in `.npmrc`, and an `.nvmrc`. CI runs on
  a Node that satisfies `engines`.
- `package.json` defines `lint`, `typecheck` (`tsc` over the app), `format`
  (Prettier write) and `format:check`. CI runs `lint`, `typecheck` and
  `format:check`. TypeScript `strict` is `true`.
- A rule a tool can check is checked by a tool: file and folder naming,
  single-letter and abbreviated names, boolean prefixes, enum names, members
  and values, string-literal unions, magic numbers, and hook rules. Use the
  reference configuration in `project-standard/tooling/frontend/`.
- Never use an inline `eslint-disable` comment and never weaken, suppress or
  bypass a rule to get a change through. If a rule is wrong, change the
  convention and the configuration.
- The configuration in `eslint.config.mjs` adapts the reference to Flows:
  `no-magic-numbers` does not apply to tests and `src/__mocks__/**` (the numbers are
  the data); boolean names an SDK, browser API or library dictates
  (`EXTERNAL_BOOLEAN_NAMES`) are exempt from the `is/has/can` prefix; `typeof`
  checks and unions inside `Pick`, `Omit` and `Exclude` are not string-literal
  comparisons; `src/main.tsx` and `vite-env.d.ts` keep the names their tools
  expect; test `.tsx` files are named after the hook or helper they cover
  (camelCase allowed); `src/cognite-file-viewer` is Cognite's own code and is
  not linted. The shared `packages/*/src` are linted and type-checked with the
  same rules as `src`. Library-dictated names are allow-listed rather than
  renamed: `initialProps` (Testing Library) and DOM, observer and event option
  booleans such as `passive`, `shiftKey`, `childList` and `subtree`, and Aura's `loading` prop. Enum
  values the CSS or DOM matches on (`data-tone`, `tone-cyan`) stay lowercase and
  are reached through a `Record<Enum, string>`.
- Passing the tools does not mean the unenforced rules are met (abbreviations
  beyond the tool's dictionary, string magic values in arguments and JSX, hook
  grouping and blank lines, prop drilling, folder mirroring, declaration
  placement). Follow them too.

## Required completion checklist

- Check changed paths, filenames (PascalCase `.tsx`, camelCase `.ts`, kebab-case
  folders), descriptive full-word names, enum keys AND values, constants and
  magic strings, type safety, imports, and component responsibilities.
- Check that new types, constants, enums and hooks were searched for first and
  sit at the right level and in the right file.
- Check hook ordering and blank-line grouping (hooks, state, refs, derived
  values, handlers, effects, return), effect dependencies and cleanup, state
  ownership, prop drilling, CDF injection, query keys, and
  loading/error/retry/empty/success rendering with the shared states.
- Check related tests and documentation; review the diff for unrelated edits.
- Run existing lint, type-check, format check, build, and relevant tests for
  code changes. Documentation-only changes do not require builds or application
  tests.
- Fix introduced failures. Report blocked checks and pre-existing failures
  explicitly; never claim validation that was not performed.
