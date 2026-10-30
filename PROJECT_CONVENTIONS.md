# Mandatory project conventions

Read this file before generating, editing, or reviewing project code.
Apply these rules to new and modified code. They take precedence over
conflicting generated template guidance in `AGENTS.md` or bundled skills.
Preserve unrelated behavior; do not perform unrequested migrations.

## Folder and file structure

- Use lowercase folders and PascalCase React component filenames.
- Pages compose screens: `src/pages/dashboard/Dashboard.tsx`,
  `src/pages/dashboard/Settings.tsx`, `src/pages/general/NotFound.tsx`.
- Feature UI belongs in `src/components/<feature>/`; nested sections are
  allowed, for example `src/components/dashboard/settings/UserList.tsx`.
- Genuinely shared UI belongs in `src/components/general/`, not miscellaneous
  feature-specific code.
- Use `src/hooks/<feature>/useAssetList.ts` for React queries and behavior,
  `src/services/<feature>/assetService.ts` for SDK operations,
  `src/types/equipment.ts` for data contracts,
  `src/enums/equipmentHealth.ts` for shared domain enums, and
  `src/constants/dashboard.ts` for meaningful configuration.
- Keep mock datasets in `src/mocks/`, separate from real services and UI.
  This also replaces the template's `src/__mocks__/` convention for factories.
- Mirror feature folders where helpful. Create folders only when needed;
  do not scaffold empty modules or introduce routing before it is required.
- Keep tests next to the code they cover, in a `__tests__/` folder inside the same
  folder: `src/components/assets/__tests__/UserList.test.tsx`,
  `src/services/assets/__tests__/assetService.test.ts`. Test files import the
  code under test with `../`.

## Naming

- Components and types use PascalCase: `UserList`, `AssetListResponse`.
  Do not prefix interfaces with `I`.
- Variables and functions use descriptive camelCase: `selectedEquipment`,
  `fetchAssets`, `formatAvailability`.
- Hooks start with `use`; booleans start with `is`, `has`, or `can`.
- Event handlers use `handlePlantChange`; callback props use `onPlantChange`.
- No abbreviated names such as `eq`, `usr`, `cfg`, or `resp`. Established
  technical terms such as `id`, API, and CDF are acceptable.

## Enums, constants, and types

- Enum type names use PascalCase. Members AND string values must use
  UPPER_SNAKE_CASE. Do not use numeric enums.

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

- Use enums for shared fixed domain statuses, not arbitrary numbers or
  free-form text. Avoid repeating raw status strings in UI logic.
- Preserve external API values; map to application enums at the service
  boundary only when needed. Reuse SDK types instead of duplicating them.
- Define explicit display labels using exhaustive `Record<Enum, string>`
  mappings; do not display raw enum values to users.
- Extract meaningful limits, thresholds, timeouts, and business values.
  Include units: `REFRESH_INTERVAL_MS`, `AVAILABILITY_THRESHOLD_PERCENT`.
- Do not extract every `0`, `1`, index, or ordinary layout value.
  Use theme tokens instead of hardcoded colors.
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
2. State and refs (`useState`, `useReducer`, `useRef`).
3. Derived values and memoized calculations.
4. Event handlers and callbacks (`handle...`).
5. Effects (`useEffect`, `useLayoutEffect`), the last group before the return.
6. Conditional returns, then the main JSX `return`, after one blank line.

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
- Keep effects near the return. Use effects only for external synchronization,
  not derived values or click handling. Keep dependencies complete and clean
  up subscriptions or obsolete asynchronous work.
- Derive values instead of copying them into state. Use TanStack Query for
  server data and the Flows host for shareable state, as in `AGENTS.md`.
- Transient state may remain local. Share state through context/storage when
  consumers must stay synchronized; do not add a store solely for isolated
  local state. This qualifies the template's blanket ViewModel state ban.
- Add `useMemo` and `useCallback` only for a concrete benefit.

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
- Use host integration for project context and credentials. Never hardcode
  credentials, tokens, or deployment-specific runtime project context.
- Include project and relevant filters in query keys.
- Prefer small typed service functions. Interface/class services and
  ViewModel hooks are appropriate only when useful; they are not mandatory
  for every operation. This supersedes the template's blanket class and
  ViewModel requirements, without weakening dependency injection.
- Keep mocks separate from real CDF services. Do not add empty abstractions.

## Rendering, imports, and quality

- Every data section handles loading, error, empty, and success states.
  Errors must be readable and actionable; never turn failures into empty
  arrays or fabricated success. Do not expose secrets in errors.
- Use stable record identifiers as React keys.
- Follow ESLint import grouping and ordering. Use `import type` for types.
- Prefer named exports, retaining defaults required by existing tooling.
  Avoid unnecessary barrels, circular imports, or new path aliases.
- Test user-visible behavior, loading, empty results, failures, and important
  interactions. Mock external CDF boundaries; never call live services in tests.
- Follow existing test-first guidance, keep related documentation current,
  and avoid unrelated refactoring or unnecessary dependencies.

## Required completion checklist

- Check changed paths, filenames, descriptive names, enum keys AND values,
  constants, type safety, imports, and component responsibilities.
- Check hook ordering and blank-line grouping (hooks, state, derived values,
  handlers, effects, return), effect dependencies and cleanup, state ownership,
  CDF injection, query keys, and loading/error/empty/success rendering.
- Check related tests and documentation; review the diff for unrelated edits.
- Run existing lint, type-check, build, and relevant tests for code changes.
  Documentation-only changes do not require builds or application tests.
- Fix introduced failures. Report blocked checks and pre-existing failures
  explicitly; never claim validation that was not performed.
