import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useScrollToEnd } from '../useScrollToEnd';

describe(useScrollToEnd.name, () => {
  it('scrolls the element to its end when an item is added', () => {
    const { rerender, getByRole } = render(<List itemCount={1} isBusy={false} />);
    const list = getByRole('log');
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 480 });

    rerender(<List itemCount={2} isBusy={false} />);

    expect(list.scrollTop).toBe(480);
  });

  it('scrolls to the end when the list becomes busy', () => {
    const { rerender, getByRole } = render(<List itemCount={1} isBusy={false} />);
    const list = getByRole('log');
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 300 });

    rerender(<List itemCount={1} isBusy />);

    expect(list.scrollTop).toBe(300);
  });

  it('leaves the scroll position alone when nothing changed', () => {
    const { rerender, getByRole } = render(<List itemCount={1} isBusy={false} />);
    const list = getByRole('log');
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 300 });

    rerender(<List itemCount={1} isBusy={false} />);

    expect(list.scrollTop).toBe(0);
  });
});

function List({ itemCount, isBusy }: { itemCount: number; isBusy: boolean }) {
  const reference = useScrollToEnd<HTMLDivElement>(itemCount, isBusy);
  return <div ref={reference} role="log" />;
}
