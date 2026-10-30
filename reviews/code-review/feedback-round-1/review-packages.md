## Package audit: Asset Passport

Commands: `npm outdated --json`, `npm audit --json` (npm audit run after upgrading `happy-dom` and `motion`).

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/app-sdk | 0.9.0 | 0.11.47681 | no | 0 | Warn — follows the Flows template |
| @cognite/aura | 0.3.5 | 1.47905.0 | no | 4 low (transitive mermaid / katex) | Warn — follows the Flows template |
| @cognite/sdk | ^10.10.0 | current | no | 0 | Pass |
| @tabler/icons-react | 3.49.0 | 3.50.0 | no | 0 | Pass |
| @tanstack/react-query | current | current | no | 0 | Pass |
| @tanstack/react-table | 8.21.3 | 9.3.1 | no | 0 | Warn — one major behind and unused |
| @tanstack/react-virtual | 3.14.22 | 3.14.23 | no | 0 | Pass (unused) |
| motion | 14.7.1 | 14.7.1 | no | 0 | Pass (upgraded from 12) |
| react / react-dom | 18.3.1 | 19.3.1 | no | 0 | Warn — one major behind, pinned by the Flows template |
| react-pdf | 9.2.1 | 11.0.0 | no | 0 | Warn — two majors behind; v11 needs React 19, plan in `README.md` |
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

`happy-dom` (high, GHSA-834v-8h66-3h79 and GHSA-c8p4-j97h-3vg8) was upgraded to 21.0.4 and no longer appears.
