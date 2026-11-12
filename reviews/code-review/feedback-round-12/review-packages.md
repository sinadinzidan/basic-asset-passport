## Package audit: Asset Passport

Source: `npm outdated --json` and `npm audit --json` at commit `a28c6c14d6e6c47a7359e52a0cd0b05e46d1ff8c`. A package not listed by `npm outdated` is current.

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `@cognite/app-sdk` | 0.9.0 | 0.11.49496 | No | 0 high/critical | Pass (pre-1.0 minors behind) |
| `@cognite/aura` | 1.49472.0 | 1.49537.0 | No | 0 high/critical | Pass |
| `@cognite/sdk` | 10.19.0 | 10.20.0 | No | 0 high/critical | Pass |
| `@adnoc/agent-mascot` | workspace | workspace | No | 0 | Pass |
| `@flows/trend-chart` | workspace | workspace | No | 0 | Pass |
| `@tabler/icons-react` | current | current | No | 0 | Pass |
| `@tanstack/react-query` | current | current | No | 0 | Pass |
| `@tanstack/react-table` | 8.21.3 | 9.3.1 | No | 0 | Warn (1 major behind; Aura's DataGrid is built on v8) |
| `@tanstack/react-virtual` | current | current | No | 0 | Pass |
| `clsx` | current | current | No | 0 | Pass |
| `dayjs` | current | current | No | 0 | Pass |
| `react` | 18.3.1 | 19.3.1 | No | 0 | Warn (1 major behind; the Flows scaffold ships React 18) |
| `react-dom` | 18.3.1 | 19.3.1 | No | 0 | Warn (1 major behind) |
| `react-pdf` | 9.2.1 | 11.0.0 | No | 0 | Warn (2 majors behind; pinned by the `integrate-file-viewer` skill at `^9.1.1`; upgrade plan in `README.md`) |
| `tailwind-merge` | current | current | No | 0 | Pass |
| `zod` | current | current | No | 0 | Pass |
| `zustand` | current | current | No | 0 | Pass |

Dev dependencies one major or more behind (not scored as production risk): `eslint` and `@eslint/js` 9 → 10, `eslint-plugin-unicorn` 63 → 79, `typescript` 5.9 → 7.0, `vite` 7 → 8, `vitest`, `@vitest/ui` and `@vitest/coverage-v8` 4 → 5, `@vitejs/plugin-react` 5 → 6, `@testing-library/jest-dom` 6 → 7, `@types/react` and `@types/react-dom` 18 → 19. Several of these are capped by the Flows scaffold's own ranges.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 11 |
| Low | 8 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| `vitest` (dev; also `@vitest/ui`, `@vitest/coverage-v8`, `@vitest/mocker`) | Moderate | Path traversal / arbitrary file read via the `@vitest/mocker` redirect mock | Not checked this round | See `npm audit` |
| `minimatch` (dev, through `typescript-eslint` and its five `@typescript-eslint/*` packages) | Moderate | Potential denial of service via globparts amplification | Not checked this round | See `npm audit` |
| `katex` (through `@cognite/aura` → `@streamdown/math`, `@streamdown/mermaid`, `mermaid`, `rehype-katex`, `remark-math`, `micromark-extension-math`) | Low | Existing prototype pollution can bypass trust restrictions | Not checked this round | See `npm audit` |

All 11 moderate advisories sit in development tooling (test runner and linter), which does not ship in the app bundle. The 8 low advisories come through Aura's markdown rendering chain.
