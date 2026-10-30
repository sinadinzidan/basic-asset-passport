## Package audit: Asset Passport (round 2)

Commands: `npm outdated --json`, `npm audit --json`.

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/app-sdk | 0.9.0 | 0.11.47681 | no | 0 | Warn — follows the Flows template |
| @cognite/aura | 0.3.5 | 1.47905.0 | no | 4 low (transitive mermaid / katex) | Warn — follows the Flows template |
| @cognite/sdk | ^10.10.0 | current | no | 0 | Pass |
| @tanstack/react-query | current | current | no | 0 | Pass |
| @tanstack/react-table | 8.21.3 | 9.3.1 | no | 0 | Warn — one major behind and unused |
| motion | 14.7.1 | 14.7.1 | no | 0 | Pass |
| react / react-dom | 18.3.1 | 19.3.1 | no | 0 | Warn — one major behind, pinned by the Flows template |
| react-pdf | 10.5.0 | 11.0.0 | no | 0 | Warn — one major behind; v11 needs React 19 (upgraded from 9, real PDF render verified) |
| recharts | ^3.7.0 | current | no | 0 | Pass |

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 4 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| vitest, @vitest/mocker, @vitest/ui, @vitest/coverage-v8 | moderate | dev test tooling | vitest 5 (breaking) | dev-only, not shipped |
| @cognite/aura → mermaid, @streamdown/mermaid, katex | low | KaTeX prototype pollution (GHSA-238p-pmpm-9mq7) | needs an Aura release | transitive of the template UI library |
