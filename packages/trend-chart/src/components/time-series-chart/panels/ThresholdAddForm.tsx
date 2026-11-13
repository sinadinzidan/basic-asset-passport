import { Button } from '@cognite/aura/components/button';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

import { THRESHOLD_LEVEL_LABELS, THRESHOLD_SIDE_LABELS } from '../../../constants/timeSeriesChart';
import { FilterLayout } from '../../../enums/display';
import { ThresholdLevel, ThresholdSide } from '../../../enums/timeSeriesChart';
import { parseThresholdValue } from '../../../lib/time-series-chart/configuredThresholds';
import type { ChartSeriesView, ConfiguredThreshold } from '../../../types/timeSeriesChart';
import { FilterSelect } from '../../general/FilterSelect';
import { InputField } from '../../general/forms/InputField';

const LEVEL_OPTIONS = Object.values(ThresholdLevel).map((level) => ({
  value: level,
  label: THRESHOLD_LEVEL_LABELS[level],
}));

const SIDE_OPTIONS = Object.values(ThresholdSide).map((side) => ({
  value: side,
  label: THRESHOLD_SIDE_LABELS[side],
}));

interface ThresholdAddFormProperties {
  series: ChartSeriesView;
  /** Adds the threshold to the chart and returns why it could not be added, if it could not. */
  onAdd: (threshold: ConfiguredThreshold) => string | undefined;
}

/**
 * Adds a threshold of the user's own to the one series it sits under: a level, a side and a value in the unit the
 * series is shown in. It starts as a button and opens into the fields. The threshold is drawn and counted like one
 * from the data source and is saved with the chart.
 */
export function ThresholdAddForm({ series, onAdd }: ThresholdAddFormProperties) {
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState(ThresholdLevel.ALERT);
  const [side, setSide] = useState(ThresholdSide.UPPER);
  const [valueText, setValueText] = useState('');
  const [error, setError] = useState<string | undefined>();

  const name = series.definition.name;

  const close = (): void => {
    setIsOpen(false);
    setValueText('');
    setError(undefined);
  };
  const add = (): void => {
    const parsed = parseThresholdValue(valueText);
    const failure =
      parsed.value === undefined
        ? parsed.error
        : onAdd({
            seriesId: series.configuration.seriesId,
            level,
            side,
            value: parsed.value,
            unit: series.unit,
          });

    setError(failure);
    if (failure === undefined) close();
  };

  if (!isOpen) {
    return (
      <div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={`Add a threshold to ${name}`}
          onClick={() => setIsOpen(true)}
        >
          <IconPlus aria-hidden className="size-4" />
          Add threshold
        </Button>
      </div>
    );
  }

  return (
    <form
      aria-label={`Add a threshold to ${name}`}
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        add();
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <FilterSelect
          label="Level"
          layout={FilterLayout.STACKED}
          hasAllOption={false}
          value={level}
          options={LEVEL_OPTIONS}
          onChange={(next) =>
            setLevel(next === ThresholdLevel.DANGER ? next : ThresholdLevel.ALERT)
          }
        />
        <FilterSelect
          label="Side"
          layout={FilterLayout.STACKED}
          hasAllOption={false}
          value={side}
          options={SIDE_OPTIONS}
          onChange={(next) => setSide(next === ThresholdSide.LOWER ? next : ThresholdSide.UPPER)}
        />
      </div>
      <InputField
        label="Value"
        value={valueText}
        unit={series.unit}
        placeholder="For example 8.5"
        errorMessage={error}
        onChange={setValueText}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="outline">
          Add threshold
        </Button>
      </div>
    </form>
  );
}
