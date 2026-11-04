# Package audit: Asset Passport (round 9)

Source: `npm outdated`, `npm audit --json`, and a search of `src/`, `vite.config.ts`, `vitest.setup.ts` for each dependency.

## Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `react` / `react-dom` | 18.3.1 | 19.3.1 | no | 0 | Warn (1 major) |
| `@tanstack/react-table` | 8.21.3 | 9.3.1 | no | 0 | Warn (1 major) |
| `@tanstack/react-query` | 5.105.0 | 5.105.3 | no | 0 | Pass |
| `@cognite/aura` | 1.48084.0 | 1.48535.0 | no | 1 moderate (transitive low chain: mermaid, katex, streamdown) | Warn |
| `@cognite/app-sdk` | 0.9.0 | 0.11.48173 | no | 0 | Warn (pre-1.0, two minors) |
| `@cognite/sdk` | 10.17.1 | 10.18.0 | no | 0 | Pass |
| `motion` | 14.7.1 | 14.9.0 | no | 0 | Warn (unused, 0 imports) |
| `pdfjs-dist` | 5.4.296 | 6.5.438 | no | 0 | Warn (unused, 1 major) |
| `react-pdf` | 10.5.0 | 11.x | no | 0 | Warn (unused, 1 major) |
| `zod` | 4.6.7 | current | no | 0 | Warn (unused in `src/`; only named in `vite.config.ts`) |
| `clsx`, `tailwind-merge`, `@tabler/icons-react`, `@tanstack/react-virtual` | current | current | no | 0 | Pass |

Dev-only and one major behind: `eslint` 9→10, `@eslint/js` 9→10, `@vitejs/plugin-react` 5→6, `@vitest/*` 4→5, `@testing-library/jest-dom` 6→7, `@types/react(-dom)` 18→19. No production dependency is two or more majors behind.

## Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 18 |
| Low | 7 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| `@cognite/aura` | moderate | Flagged through its dependency chain | upgrade `@cognite/aura` | `npm audit` |
| `vitest`, `@vitest/ui`, `@vitest/coverage-v8`, `@vitest/mocker` | moderate | Dev tooling chain | `vitest` upgrade | `npm audit` |
| `typescript-eslint` and `@typescript-eslint/*`, `eslint`, `@eslint/*`, `minimatch` | moderate | Lint tooling chain | `typescript-eslint` upgrade | `npm audit` |
| `eslint-plugin-import`, `eslint-plugin-react-refresh` | moderate | Lint plugins | upgrade plugin | `npm audit` |
| `mermaid`, `katex`, `rehype-katex`, `remark-math`, `micromark-extension-math`, `@streamdown/*` | low | Reached only through `@cognite/aura` | `@cognite/aura` upgrade | `npm audit` |

All moderate findings are in dev tooling or reached through Aura; none ships in app code the user runs beyond what Aura already bundles. No critical or high advisories.
