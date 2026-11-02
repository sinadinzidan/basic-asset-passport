# Package audit: Asset Passport (round 8)

Commands: `npm outdated --json`, `npm audit --json`. Installed on Node 26.13.0 with npm 12.2.1. `npm ci --dry-run` succeeds against the committed `package-lock.json`.

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/app-sdk | 0.9.0 | 0.11.48173 | no | 0 | Warn — pre-1.0, pinned by the Flows template |
| @cognite/aura | 1.48084.0 | 1.48346.0 | no | 7 low (transitive mermaid / katex) | Pass — a few days behind the newest |
| @cognite/sdk | 10.17.1 | current | no | 0 | Pass |
| @tabler/icons-react | 3.50.0 | current | no | 0 | Pass |
| @tanstack/react-query | current | current | no | 0 | Pass |
| zod | 4.6.7 | current | no | 0 | Pass — new in round 8, declared |
| motion | 14.7.1 | 14.9.0 | no | 0 | Pass — two minors behind |
| react / react-dom | 18.3.1 | 19.3.1 | no | 0 | Warn — one major behind, pinned by the Flows template |
| react-pdf | 10.5.0 | 11.0.0 | no | 0 | Warn — one major behind; v11 needs React 19 |
| pdfjs-dist | 5.4.296 | 6.4.299 | no | 0 | Warn — one major behind; must match `react-pdf` 10 |

`clsx` and `tailwind-merge` are no longer dependencies (removed in round 8; the app never imported them).

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 18 |
| Low | 7 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| vitest, @vitest/*, eslint, @eslint/*, typescript-eslint, eslint-plugin-import, minimatch | moderate | dev tooling (minimatch ReDoS and the packages that depend on it) | newer eslint / vitest majors (breaking; the template pins them) | dev-only, not shipped |
| @cognite/aura → mermaid, @streamdown/*, katex, remark/rehype math | low | KaTeX prototype pollution | needs an Aura release | transitive of the template UI library; the app does not render math or diagrams |
