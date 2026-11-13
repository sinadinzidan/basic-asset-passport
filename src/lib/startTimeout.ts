export function startTimeout(onDone: () => void, delayMs: number): () => void {
  const id = setTimeout(onDone, delayMs);

  return () => clearTimeout(id);
}
