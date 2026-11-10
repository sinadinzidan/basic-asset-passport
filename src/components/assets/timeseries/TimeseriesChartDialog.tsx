import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import {
  ChartAdapterContext,
  IndustrialTimeSeriesChart,
  type ChartConfiguration,
  type ChartDataSource,
} from '@flows/trend-chart';

type TimeseriesChartDialogProps = {
  isOpen: boolean;
  source: ChartDataSource;
  configuration: ChartConfiguration | null;
  nowMs: number;
  /** Names the exported files, such as the asset's name. */
  exportName: string;
  onConfigurationChange: (configuration: ChartConfiguration) => void;
  onClose: () => void;
};

/** The trend chart over the whole screen: the series of an asset to compare, window, layers and export. */
export function TimeseriesChartDialog({
  isOpen,
  source,
  configuration,
  nowMs,
  exportName,
  onConfigurationChange,
  onClose,
}: TimeseriesChartDialogProps) {
  function handleOpenChange(open: boolean): void {
    if (!open) onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="timeseries-chart-dialog fixed inset-0 left-0 top-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">
          {configuration?.title ?? 'Timeseries'} chart
        </DialogTitle>
        <DialogDescription className="sr-only">
          The timeseries of {exportName} in the chart workspace.
        </DialogDescription>
        <DialogClose className="sr-only" aria-label="Close" />
        {configuration ? (
          <ChartAdapterContext.Provider value={source}>
            <IndustrialTimeSeriesChart
              isLiveDisabled
              configuration={configuration}
              onConfigurationChange={onConfigurationChange}
              nowMs={nowMs}
              exportName={exportName}
              closeLabel="Close chart"
              onClose={onClose}
            />
          </ChartAdapterContext.Provider>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
