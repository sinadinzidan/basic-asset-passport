## Package audit: Asset Passport

Source: `npm outdated --json` and `npm audit --json` at commit `76785ed79126392cf0cdb9ff811f4ac63100944f`. A package not listed by `npm outdated` is current.

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `@cognite/app-sdk` | 0.9.0 | 0.11.49496 | No | 0 | Pass (the version the Flows scaffold pins; later releases need Vite 8, which the scaffold excludes) |
| `@cognite/aura` | 1.49537.0 | 1.49537.0 | No | 0 | Pass |
| `@cognite/sdk` | 10.20.0 | 10.20.0 | No | 0 | Pass |
| `@adnoc/agent-mascot` | workspace | workspace | No | 0 | Pass |
| `@flows/trend-chart` | workspace | workspace | No | 0 | Pass |
| `@tabler/icons-react` | current | current | No | 0 | Pass |
| `@tanstack/react-query` | current | current | No | 0 | Pass |
| `@tanstack/react-table` | 8.21.3 | 9.3.1 | No | 0 | Warn (1 major behind; `@cognite/aura` accepts only `^8.7.4`) |
| `@tanstack/react-virtual` | current | current | No | 0 | Pass |
| `clsx` | current | current | No | 0 | Pass |
| `dayjs` | current | current | No | 0 | Pass |
| `react` | 18.3.1 | 19.3.1 | No | 0 | Warn (1 major behind; `@cognite/aura` and `@cognite/app-sdk` accept only `^18.3.1`) |
| `react-dom` | 18.3.1 | 19.3.1 | No | 0 | Warn (1 major behind, with React) |
| `react-pdf` | 10.5.0 | 11.0.0 | No | 0 | Warn (1 major behind; 11 requires React 19) |
| `tailwind-merge` | current | current | No | 0 | Pass |
| `zod` | current | current | No | 0 | Pass |
| `zustand` | current | current | No | 0 | Pass |

The four packages a major behind are all held by one thing: `@cognite/aura` does not yet accept React 19. The plan is in `README.md` ("Dependencies held back"): raise all four together when Aura does.

`react-pdf` moved from 9.2.1 to 10.5.0 this round. The vendored viewer was checked against it in a browser with a real two-page PDF (document load, page change, text layer).

Dev dependencies a major behind (not scored as production risk): `eslint` and `@eslint/js` 9 → 10 (Aura pins 9.39.4), `eslint-plugin-unicorn` 63 → 79 (needs ESLint 10), `typescript` 5.9 → 7.0 (`typescript-eslint` supports below 6.1), `vite` 7 → 8 and `@vitejs/plugin-react` 5 → 6 (the scaffold holds Vite below 8), `vitest`, `@vitest/ui` and `@vitest/coverage-v8` 4 → 5, `@testing-library/jest-dom` 6 → 7, `@types/react` and `@types/react-dom` 18 → 19.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |

`npm audit` reports 0 vulnerabilities. The 19 advisories of round 12 were cleared by:

| Package | Was | Fix |
| ------- | --- | --- |
| `vitest`, `@vitest/ui`, `@vitest/coverage-v8` (dev) | Moderate, `@vitest/mocker` path traversal and mock registration | Raised to 4.1.12 |
| `minimatch` under `@typescript-eslint/typescript-estree` (dev) | Moderate, denial of service | `overrides` entry lifts it to `^11.0.1`; lint still passes |
| `katex` under Aura's markdown chain | Low, prototype pollution bypass | `overrides` entry lifts it to `^0.18.2`, the version Aura itself already uses |
