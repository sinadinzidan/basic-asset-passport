import { Button } from '@cognite/aura/components/button';
import { useState } from 'react';

import { ChartMode } from '../../../enums/monitoring';
import { AxisScaleMode } from '../../../enums/timeSeriesChart';
import { axisSettingFor, validateAxisLimits, withAxisSetting } from '../../../lib/time-series-chart/axes';
import type { AxisSetting, ChartSeriesView } from '../../../types/timeSeriesChart';
import { InputField } from '../../general/forms/InputField';
import { SwitchField } from '../../general/forms/SwitchField';
import { StateMessage } from '../../general/StateMessage';

import { PanelSection } from './PanelSection';
import { SeriesLabel } from './SeriesLabel';

interface AxesPanelProps {
  series: readonly ChartSeriesView[];
  axes: readonly AxisSetting[];
  mode: ChartMode;
  onAxesChange: (axes: AxisSetting[]) => void;
  onModeChange: (mode: ChartMode) => void;
}

interface AxisRowProps {
  view: ChartSeriesView;
  setting: AxisSetting;
  onApply: (setting: AxisSetting) => void;
}

const textOf = (limit: number | undefined): string => (limit === undefined ? '' : String(limit));

function AxisRow({ view, setting, onApply }: AxisRowProps) {
  const [minText, setMinText] = useState(textOf(setting.min));
  const [maxText, setMaxText] = useState(textOf(setting.max));
  const [error, setError] = useState<string | undefined>();
  const seriesId = view.definition.id;
  const isManual = setting.mode === AxisScaleMode.MANUAL;
  const isChanged = minText.trim() !== textOf(setting.min) || maxText.trim() !== textOf(setting.max);

  const apply = (): void => {
    const result = validateAxisLimits(seriesId, minText, maxText, setting);
    setError(result.error);
    if (!result.error) onApply(result.setting);
  };
  const reset = (): void => {
    setMinText('');
    setMaxText('');
    setError(undefined);
    onApply({ seriesId, mode: AxisScaleMode.AUTO });
  };

  return (
    <fieldset className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <legend className="sr-only">{`Axis of ${view.definition.name}`}</legend>
      <div className="flex items-center justify-between gap-2">
        <SeriesLabel series={view} />
        {view.unit ? <span className="shrink-0 text-xs text-muted-foreground">{view.unit}</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Minimum" type="text" value={minText} placeholder="Automatic" onChange={setMinText} />
        <InputField label="Maximum" type="text" value={maxText} placeholder="Automatic" onChange={setMaxText} />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive-foreground">
          {error}
        </p>
      ) : null}
      {isChanged || isManual ? (
        <div className="flex items-center justify-end gap-2">
          {isManual ? (
            <Button type="button" size="sm" variant="ghost" data-appearance="link" onClick={reset}>
              Use automatic
            </Button>
          ) : null}
          {isChanged ? (
            <Button type="button" size="sm" variant="outline" onClick={apply}>
              Apply limits
            </Button>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}

export function AxesPanel({ series, axes, mode, onAxesChange, onModeChange }: AxesPanelProps) {
  const isNormalised = mode === ChartMode.NORMALISED;
  return (
    <>
      <SwitchField
        label="Normalise to 0 to 100 %"
        description="Scales each series to its own range, so series in different units can be compared by shape."
        checked={isNormalised}
        onChange={(next) => onModeChange(next ? ChartMode.NORMALISED : ChartMode.OVERLAID)}
      />
      <PanelSection title="Limits">
        {isNormalised ? (
          <p className="text-xs text-muted-foreground">
            Limits apply to the axes in their own units. Turn normalising off to set them.
          </p>
        ) : series.length === 0 ? (
          <StateMessage
            size="inline"
            title="No series to scale"
            description="Add data to set the limits of its axis."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {series.map((view) => {
              const setting = axisSettingFor(axes, view.definition.id);
              return (
                <AxisRow
                  key={`${view.definition.id}-${JSON.stringify(setting)}`}
                  view={view}
                  setting={setting}
                  onApply={(next) => onAxesChange(withAxisSetting(axes, next))}
                />
              );
            })}
          </div>
        )}
      </PanelSection>
    </>
  );
}
