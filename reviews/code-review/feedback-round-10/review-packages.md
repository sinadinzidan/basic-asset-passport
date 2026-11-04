# Package audit: Asset Passport (round 10)

Source: `npm outdated`, `npm audit --json`, and a search of `src/`, `vite.config.ts`, `index.html` for each production dependency. Aura, the CDF SDK and React Query were updated in range (lockfile only) before this audit.

## Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `react` / `react-dom` | 18.3.1 | 19.3.1 | no | 0 | Warn (1 major; Aura pins React 18) |
| `@tanstack/react-table` | 8.21.3 | 9.3.1 | no | 0 | Warn (1 major; Aura peer is `^8`) |
| `@tanstack/react-query` | 5.105.3 | 5.105.3 | no | 0 | Pass |
| `@tanstack/react-virtual` | 3.x | current | no | 0 | Pass (Aura peer dependency; not imported in `src/`) |
| `@cognite/aura` | 1.48535.0 | 1.48535.0 | no | moderate chain below | Pass (current) |
| `@cognite/sdk` | 10.18.0 | 10.18.0 | no | 0 | Pass |
| `@cognite/app-sdk` | 0.9.0 | 0.11.48173 | no | 0 | Warn (pre-1.0, two minors) |
| `@tabler/icons-react`, `clsx`, `tailwind-merge` | current | current | no | 0 | Pass |

Removed since round 9: `motion`, `pdfjs-dist`, `react-pdf`, `zod` (all unused). Dev-only and one major behind: `eslint` 9→10, `@vitejs/plugin-react` 5→6, `@vitest/*` 4→5, `@testing-library/jest-dom` 6→7, `@types/react(-dom)` 18→19. No production dependency is two or more majors behind.

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
| `vitest`, `@vitest/ui`, `@vitest/coverage-v8`, `@vitest/mocker` | moderate | Dev tooling chain | `vitest` upgrade | `npm audit` |
| `typescript-eslint`, `@typescript-eslint/*`, `eslint`, `@eslint/*`, `minimatch`, `eslint-plugin-import`, `eslint-plugin-react-refresh` | moderate | Lint tooling chain | tooling upgrade | `npm audit` |
| `@cognite/aura` | moderate | Flagged through its dependency chain | next Aura release | `npm audit` |
| `mermaid`, `katex`, `rehype-katex`, `remark-math`, `micromark-extension-math`, `@streamdown/*` | low | Reached only through `@cognite/aura` | Aura release | `npm audit` |

`npm audit --audit-level=high` exits 0. All moderate findings are in dev tooling or Aura's own chain.
