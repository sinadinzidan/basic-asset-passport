## Package audit: Asset Passport (round 5)

Commands: `npm outdated --json`, `npm audit --json`, `npx depcheck`. Installed on Node 26.13.0 with npm 12.2.1.

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| @cognite/app-sdk | 0.9.0 | 0.11.47681 | no | 0 | Warn — pinned by the Flows template |
| @cognite/aura | 1.48084.0 | 1.48173.0 | no | 4 low (transitive mermaid / katex) | Pass — current (the 1-day release-age rule holds back the newest) |
| @cognite/sdk | 10.17.1 | current | no | 0 | Pass |
| @tabler/icons-react | 3.50.0 | current | no | 0 | Pass |
| @tanstack/react-query | current | current | no | 0 | Pass |
| clsx, tailwind-merge | current | current | no | 0 | Pass (template defaults, not imported by app code) |
| motion | 14.7.1 | current | no | 0 | Pass |
| pdfjs-dist | 5.4.296 | current | no | 0 | Pass (pinned to the version `react-pdf` uses) |
| react / react-dom | 18.3.1 | 19.3.1 | no | 0 | Warn — one major behind, pinned by the Flows template |
| react-pdf | 10.5.0 | 11.0.0 | no | 0 | Warn — one major behind; v11 needs React 19 |

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 8 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| vitest, @vitest/mocker, @vitest/ui, @vitest/coverage-v8 | moderate | dev test tooling | vitest 5 (breaking; the template pins 4.1.10) | dev-only, not shipped |
| @cognite/aura → mermaid, @streamdown/*, katex, remark/rehype math | low | KaTeX prototype pollution (GHSA-238p-pmpm-9mq7) | needs an Aura release | transitive of the template UI library |

`happy-dom` (high, GHSA-834v-8h66-3h79 and GHSA-c8p4-j97h-3vg8) was upgraded from the template's `^20.9.0` (resolved to 20.14.6) to `^21.0.4` and no longer appears.
