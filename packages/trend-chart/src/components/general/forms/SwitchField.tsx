import { Switch } from '@cognite/aura/components/switch';
import { useId } from 'react';

import { cn } from '../../../lib/utils';

import { SWITCH_CLASSES } from './fieldStyles';

interface SwitchFieldProperties {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  isDisabled?: boolean;
  className?: string;
}

export function SwitchField({
  label,
  checked,
  onChange,
  description,
  isDisabled,
  className,
}: SwitchFieldProperties) {
  const id = useId();
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          aria-describedby={description ? `${id}-description` : undefined}
          className={SWITCH_CLASSES}
          checked={checked}
          disabled={isDisabled}
          onCheckedChange={(isOn) => onChange(isOn)}
        />
        <label
          htmlFor={id}
          className="text-sm leading-none font-medium text-foreground select-none"
        >
          {label}
        </label>
      </div>
      {description ? (
        <p id={`${id}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
