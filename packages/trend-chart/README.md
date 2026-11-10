# @flows/trend-chart

A time-series chart for Flows apps. It adds signals, sets the window, axes, layers, thresholds, alerting, data profiling and monitoring, hosts an optional assistant panel, and exports to CSV and PNG. It knows nothing about the app that shows it: it reads everything through one adapter.

The package is shared as source and is never published. An app uses it through a local link.

## Use it in an app

1. **Link the package.** In this repository it is an npm workspace (`workspaces: ["packages/*"]`) and an app depends on it with `"@flows/trend-chart": "*"`. From another repository, copy `packages/trend-chart` next to the app and depend on it with `"@flows/trend-chart": "file:../trend-chart"`.
2. **Provide the peer dependencies:** `react`, `@tanstack/react-query`, `dayjs`, `clsx`, `tailwind-merge`, `@tabler/icons-react` and `@cognite/aura`. The ranges are in `package.json`.
3. **Let Tailwind see the package's classes.** In the app's stylesheet add `@source '../node_modules/@flows/trend-chart/src';` (or the relative path to the package when it is linked from outside `node_modules`).
4. **When linked with `file:`, share one copy of React.** In `vite.config.ts` set `resolve.dedupe: ['react', 'react-dom', '@tanstack/react-query']`.
5. **Render the providers above the chart:** a `QueryClientProvider`, and Aura's `Toaster` for the chart's toasts.
6. **Implement `ChartDataAdapter`** and provide it:

   ```tsx
   import { ChartAdapterContext, IndustrialTimeSeriesChart } from '@flows/trend-chart';

   <ChartAdapterContext.Provider value={{ adapter, scopeKey }}>
     <IndustrialTimeSeriesChart
       configuration={configuration}
       onConfigurationChange={setConfiguration}
       nowMs={Date.now()}
       exportName="pump-p-310a"
     />
   </ChartAdapterContext.Provider>
   ```

   `scopeKey` names what the adapter reads, so cached queries of one scope are never reused for another. The adapter has seven methods: `searchSeries`, `getSeriesData`, `getSeriesDetails`, `getThresholds`, `getAlerts`, `getConnectedFiles` and `getEvents` (see `types/timeSeriesChart.ts`).

The chart keeps its whole setup (series, window, mode, layers, open panel) in `configuration`. A host that wants it restored on reload or in a shared link stores that object; `serialiseConfiguration` and `parseConfiguration` turn it into and out of a flat string record.

## What the host can set

| Need | How |
| --- | --- |
| Time zone | `setChartTimeZone({ id: 'Europe/Oslo', label: 'CET' })` once at start. The default is UTC. |
| Event markers | `getEvents` returns `ChartEvent`s. A `kind` is any string; `kindLabel`, `shape` and `tone` say how it looks and reads. |
| Assistant | Pass `assistantPanel` (and optionally `assistantLabel`) to `IndustrialTimeSeriesChart`. Without `assistantPanel` the chart shows no assistant button. |
| Top bar colour | Set the `--chart-band-*` variables on `:root`; they are listed at the top of `src/chart.css` and default to a blue band. The side panel also follows `--card-background` and `--field-radius` when the theme defines them. |
| Header actions | `extraActions`, `onClose` and `closeLabel`. |
| Live mode | `isLiveDisabled` turns the live button off. |
| Event clicks | `onEventSelect` receives the `ChartEvent` that was picked. |

## Layout

| Folder | What is in it |
| --- | --- |
| `src/components/time-series-chart/` | The chart, its toolbar, the plot and the side panels |
| `src/components/general/`, `src/components/monitoring/` | Small shared pieces: state messages, fields, pills, table styles |
| `src/hooks/` | Chart model, data adapter context, series search, live feed, timers |
| `src/lib/`, `src/constants/`, `src/enums/`, `src/types/` | Calculations, labels, formats, shared types |
| `src/chart.css` | The chart's own styles |

## Tests

Tests sit in `__tests__` folders next to the code they cover and run with the app's Vitest (`npm test` at the repository root).
