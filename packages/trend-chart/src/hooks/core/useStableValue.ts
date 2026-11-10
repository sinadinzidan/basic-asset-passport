import { useState } from 'react';

/**
 * The value as it was, while a new one holds the same data. A page that parses its state afresh on each change hands down new arrays
 * and objects that are equal to the old ones; returning the earlier one keeps memoised work and effects from running again.
 * Compared as JSON, so use it for small plain data, never for large arrays.
 */
export function useStableValue<Value>(value: Value): Value {
  const [stable, setStable] = useState(value);
  const isSame = stable === value || JSON.stringify(stable) === JSON.stringify(value);
  if (!isSame) setStable(value);
  return isSame ? stable : value;
}
