import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InputType } from '../../../../enums/inputType';
import { FieldInput, InputField } from '../InputField';

describe(InputField.name, () => {
  it('shows the value in a text box named by the label', () => {
    renderField({ value: 'Pump 4' });

    expect(screen.getByRole('textbox', { name: 'Chart title' })).toHaveValue('Pump 4');
  });

  it('reports what is typed', async () => {
    const onChange = vi.fn();
    renderField({ value: 'Pump', onChange });

    await userEvent.type(screen.getByRole('textbox'), 's');

    expect(onChange).toHaveBeenCalledWith('Pumps');
  });

  it('reports when the field is left', async () => {
    const onBlur = vi.fn();
    renderField({ onBlur });

    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();

    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('shows the placeholder while empty', () => {
    renderField({ placeholder: 'Untitled chart' });

    expect(screen.getByPlaceholderText('Untitled chart')).toBeInTheDocument();
  });

  it('counts the characters against the limit', () => {
    renderField({ value: 'Pump', maxLength: 80 });

    expect(screen.getByText('4 / 80')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '80');
  });

  it('shows no count without a limit', () => {
    renderField({ value: 'Pump' });

    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });

  it('shows the unit after the control', () => {
    renderField({ unit: 'bar' });

    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('takes a number with a decimal keyboard, within its limits', () => {
    renderField({ type: InputType.NUMBER, value: '5', min: '0', max: '10' });

    const control = screen.getByRole('spinbutton', { name: 'Chart title' });
    expect(control).toHaveAttribute('inputmode', 'decimal');
    expect(control).toHaveAttribute('min', '0');
    expect(control).toHaveAttribute('max', '10');
  });

  it('offers the suggestions through a list the control points at', () => {
    const { container } = renderField({ suggestions: ['bar', 'kPa'] });

    const list = container.querySelector('datalist');
    expect([...(list?.querySelectorAll('option') ?? [])].map((option) => option.value)).toEqual([
      'bar',
      'kPa',
    ]);
    expect(screen.getByRole('combobox', { name: 'Chart title' })).toHaveAttribute('list', list?.id);
  });

  it('has no list without suggestions', () => {
    const { container } = renderField();

    expect(container.querySelector('datalist')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('list');
  });

  it('can be disabled', () => {
    renderField({ isDisabled: true });

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('can show a value that cannot be changed', () => {
    renderField({ isReadOnly: true });

    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('shows the error and marks the control invalid', () => {
    renderField({ errorMessage: 'Enter a title' });

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title');
    expect(screen.getByRole('textbox')).toBeInvalid();
  });

  it('says when the field is required', () => {
    renderField({ isRequired: true });

    expect(screen.getByRole('textbox')).toBeRequired();
  });
});

describe(FieldInput.name, () => {
  it('is an input with the field look and the classes it is given', () => {
    render(<FieldInput aria-label="Search" className="flex-1" />);

    const control = screen.getByRole('textbox', { name: 'Search' });
    expect(control).toHaveAttribute('data-slot', 'input-field');
    expect(control).toHaveClass('flex-1', 'h-9');
  });
});

function renderField(overrides: Partial<Parameters<typeof InputField>[0]> = {}) {
  return render(<InputField label="Chart title" value="" onChange={vi.fn()} {...overrides} />);
}
