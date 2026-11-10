import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

import type { FieldOrientation } from '../../../enums/display';
import { cn } from '../../../lib/utils';

import type { BaseFieldProps } from './fieldProps';
import { FIELD_CONTROL_CLASSES } from './fieldStyles';
import { CharacterCount, FormField } from './FormField';

interface InputFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'number' | 'date' | 'datetime-local' | 'time';
  placeholder?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  unit?: string;
  suggestions?: readonly string[];
  /** Shows the value but does not let it be changed; unlike disabled it is still read and announced. */
  isReadOnly?: boolean;
  orientation?: FieldOrientation;
}

/** An id safe to use in a CSS selector or a `list` attribute: React's generated ids contain colons. */
function useSafeId(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

export function FieldInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input data-slot="input-field" className={cn(FIELD_CONTROL_CLASSES, className)} {...props} />;
}

export function InputField({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  maxLength,
  min,
  max,
  unit,
  suggestions,
  isRequired,
  description,
  errorMessage,
  isDisabled,
  isReadOnly,
  orientation,
  className,
}: InputFieldProps) {
  const listId = `${useSafeId()}-suggestions`;
  return (
    <FormField
      label={label}
      isRequired={isRequired}
      description={description}
      errorMessage={errorMessage}
      orientation={orientation}
      labelAccessory={maxLength ? <CharacterCount length={value.length} maxLength={maxLength} /> : undefined}
      className={className}
    >
      {(control) => (
        <div className="flex items-center gap-2">
          <FieldInput
            {...control}
            className="flex-1"
            list={suggestions ? listId : undefined}
            type={type}
            value={value}
            min={min}
            max={max}
            maxLength={maxLength}
            inputMode={type === 'number' ? 'decimal' : undefined}
            placeholder={placeholder}
            disabled={isDisabled}
            readOnly={isReadOnly}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
          />
          {unit ? <span className="shrink-0 text-sm text-muted-foreground">{unit}</span> : null}
          {suggestions ? (
            <datalist id={listId}>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          ) : null}
        </div>
      )}
    </FormField>
  );
}
