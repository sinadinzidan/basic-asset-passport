import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldOrientation } from '../../../../enums/display';
import { CharacterCount, FieldMessage, FormField } from '../FormField';

describe(FormField.name, () => {
  it('names its control by the label', () => {
    renderField();

    expect(screen.getByLabelText('Chart title')).toBe(screen.getByRole('textbox'));
  });

  it('marks nothing on a plain control', () => {
    renderField();

    const control = screen.getByRole('textbox');
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).not.toHaveAttribute('aria-describedby');
    expect(control).not.toHaveAttribute('aria-required');
  });

  it('says that a required control is required, in words as well as with the star', () => {
    renderField({ isRequired: true });

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('describes the control by its description', () => {
    renderField({ description: 'Shown above the plot' });

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Shown above the plot');
  });

  it('marks the control invalid and announces the error', () => {
    renderField({ errorMessage: 'Enter a title' });

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Enter a title');
  });

  it('shows the error in place of the description', () => {
    renderField({ description: 'Shown above the plot', errorMessage: 'Enter a title' });

    expect(screen.queryByText('Shown above the plot')).not.toBeInTheDocument();
  });

  it('shows the accessory beside the label', () => {
    renderField({ labelAccessory: <span>3 / 80</span> });

    expect(screen.getByText('3 / 80')).toBeInTheDocument();
  });

  it('keeps the label, the control and the message when laid out in a row', () => {
    renderField({ orientation: FieldOrientation.HORIZONTAL, description: 'Shown above the plot' });

    expect(screen.getByLabelText('Chart title')).toHaveAccessibleDescription(
      'Shown above the plot',
    );
  });

  it('adds the class it is given', () => {
    const { container } = renderField({ className: 'w-64' });

    expect(container.firstElementChild).toHaveClass('w-64');
  });
});

describe(CharacterCount.name, () => {
  it('shows how much of the room is used', () => {
    render(<CharacterCount length={3} maxLength={80} />);

    expect(screen.getByText('3 / 80')).not.toHaveClass('text-destructive');
  });

  it('turns to the error colour once the room is used up', () => {
    render(<CharacterCount length={80} maxLength={80} />);

    expect(screen.getByText('80 / 80')).toHaveClass('text-destructive');
  });
});

describe(FieldMessage.name, () => {
  it('shows the description', () => {
    render(<FieldMessage id="message" description="Shown above the plot" />);

    expect(screen.getByText('Shown above the plot')).toHaveAttribute('id', 'message');
  });

  it('announces the error as an alert', () => {
    render(
      <FieldMessage id="message" errorMessage="Enter a title" description="Shown above the plot" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title');
  });

  it('shows nothing without an error or a description', () => {
    const { container } = render(<FieldMessage id="message" />);

    expect(container).toBeEmptyDOMElement();
  });
});

function renderField(overrides: Partial<Parameters<typeof FormField>[0]> = {}) {
  return render(
    <FormField label="Chart title" {...overrides}>
      {(control) => <input type="text" {...control} />}
    </FormField>,
  );
}
