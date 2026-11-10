import type { FieldOrientation } from '../../../enums/display';

import type { BaseFieldProps } from './fieldProps';
import { TEXTAREA_CONTROL_CLASSES } from './fieldStyles';
import { CharacterCount, FormField } from './FormField';

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  /** Shows the value but does not let it be changed; unlike disabled it is still read and announced. */
  isReadOnly?: boolean;
  orientation?: FieldOrientation;
}

export function TextareaField({
  label,
  value,
  onChange,
  onBlur,
  rows = 4,
  placeholder,
  maxLength,
  isRequired,
  description,
  errorMessage,
  isDisabled,
  isReadOnly,
  orientation,
  className,
}: TextareaFieldProps) {
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
        <textarea
          {...control}
          data-slot="textarea-field"
          className={TEXTAREA_CONTROL_CLASSES}
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={isDisabled}
          readOnly={isReadOnly}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
