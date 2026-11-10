import { IconAlertCircle } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import { FieldOrientation } from '../../../enums/display';
import { cn } from '../../../lib/utils';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
  'aria-required': boolean | undefined;
}

interface FormFieldProps {
  label: string;
  isRequired?: boolean;
  description?: string;
  errorMessage?: string;
  orientation?: FieldOrientation;
  /** Shown at the right end of the label row, for example a character count, so the message stays directly under the control. */
  labelAccessory?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function FormField({
  label,
  isRequired = false,
  description,
  errorMessage,
  orientation = FieldOrientation.VERTICAL,
  labelAccessory,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(errorMessage ?? description);
  const isHorizontal = orientation === FieldOrientation.HORIZONTAL;
  const labelElement = (
    <label
      htmlFor={id}
      className={cn('text-sm leading-none font-medium text-foreground select-none', isHorizontal && 'shrink-0')}
    >
      {label}
      {isRequired ? (
        <>
          <span aria-hidden className="text-destructive">
            {' '}
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      ) : null}
    </label>
  );
  const control = children({
    id,
    'aria-invalid': errorMessage ? true : undefined,
    'aria-describedby': hasMessage ? messageId : undefined,
    'aria-required': isRequired ? true : undefined,
  });
  const message = <FieldMessage id={messageId} errorMessage={errorMessage} description={description} />;
  if (isHorizontal) {
    return (
      <div className={cn('flex min-w-0 items-center gap-3', className)}>
        {labelElement}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {control}
          {message}
        </div>
      </div>
    );
  }
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      {labelAccessory ? (
        <div className="flex items-baseline justify-between gap-2">
          {labelElement}
          {labelAccessory}
        </div>
      ) : (
        labelElement
      )}
      {control}
      {message}
    </div>
  );
}

interface CharacterCountProps {
  length: number;
  maxLength: number;
}

export function CharacterCount({ length, maxLength }: CharacterCountProps) {
  return (
    <span
      className={cn('tabular-nums shrink-0 text-xs text-muted-foreground', length >= maxLength && 'text-destructive')}
    >{`${length} / ${maxLength}`}</span>
  );
}

interface FieldMessageProps {
  id: string;
  errorMessage?: string;
  description?: string;
}

export function FieldMessage({ id, errorMessage, description }: FieldMessageProps) {
  if (errorMessage) {
    return (
      <p id={id} role="alert" className="flex items-start gap-1 text-sm font-normal text-destructive">
        <IconAlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
        <span>{errorMessage}</span>
      </p>
    );
  }
  return description ? (
    <p id={id} className="text-sm font-normal text-muted-foreground">
      {description}
    </p>
  ) : null;
}
