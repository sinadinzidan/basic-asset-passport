import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cognite/aura/components/select';
import { useId } from 'react';

import { FilterLayout } from '../../enums/display';
import { SelectSize } from '../../enums/selectSize';

const TRIGGER_SIZE_BY_SIZE = {
  [SelectSize.SMALL]: 'sm',
  [SelectSize.DEFAULT]: 'default',
} as const;

export const ALL_OPTION_VALUE = '__ALL__';

interface FilterSelectProperties {
  label: string;
  value: string | undefined;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
  allLabel?: string;
  size?: SelectSize;
  layout?: FilterLayout;
  /** False removes the "All" choice, for a filter that always has a value such as a year. */
  hasAllOption?: boolean;
  /** Keeps the label for assistive technology only, when the choice already names itself (an "Any role" placeholder). */
  isLabelHidden?: boolean;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel = 'All',
  size = SelectSize.SMALL,
  layout = FilterLayout.INLINE,
  hasAllOption = true,
  isLabelHidden = false,
}: FilterSelectProperties) {
  const labelId = useId();
  const current = value ?? ALL_OPTION_VALUE;
  const selectedLabel =
    current === ALL_OPTION_VALUE
      ? allLabel
      : (options.find((option) => option.value === current)?.label ?? allLabel);
  const control = (
    <Select
      value={current}
      onValueChange={(next) => onChange(next === ALL_OPTION_VALUE ? undefined : next)}
    >
      <SelectTrigger size={TRIGGER_SIZE_BY_SIZE[size]} aria-labelledby={labelId}>
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {hasAllOption ? <SelectItem value={ALL_OPTION_VALUE}>{allLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  if (layout === FilterLayout.INLINE) {
    return (
      <div className="inline-flex min-w-0 items-center gap-2">
        <span
          className={
            isLabelHidden
              ? 'sr-only'
              : 'whitespace-nowrap text-xs font-medium text-muted-foreground'
          }
          id={labelId}
        >
          {label}
        </span>
        {control}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className={isLabelHidden ? 'sr-only' : 'text-xs font-medium text-muted-foreground'}
        id={labelId}
      >
        {label}
      </span>
      {control}
    </div>
  );
}
