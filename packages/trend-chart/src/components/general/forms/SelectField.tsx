import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';

import type { FieldOrientation } from '../../../enums/display';

import type { BaseFieldProps } from './fieldProps';
import { SELECT_CONTENT_CLASSES, SELECT_ITEM_CLASSES, SELECT_TRIGGER_CLASSES } from './fieldStyles';
import { FormField } from './FormField';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  /** The chosen value; an empty string means nothing is chosen yet. */
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  orientation?: FieldOrientation;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  isRequired,
  description,
  errorMessage,
  isDisabled,
  orientation,
  className,
}: SelectFieldProps) {
  const chosen = options.find((option) => option.value === value);
  return (
    <FormField
      label={label}
      isRequired={isRequired}
      description={description}
      errorMessage={errorMessage}
      orientation={orientation}
      className={className}
    >
      {(control) => (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
          <SelectTrigger {...control} className={SELECT_TRIGGER_CLASSES}>
            <SelectValue>
              {chosen ? chosen.label : <span className="font-normal text-muted-foreground">{placeholder}</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT_CLASSES}>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CLASSES}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
