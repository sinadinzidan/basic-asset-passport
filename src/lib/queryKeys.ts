export function isKeyOfList(
  queryKey: readonly unknown[] | undefined,
  listKey: readonly unknown[],
): boolean {
  return queryKey !== undefined && listKey.every((part, index) => queryKey[index] === part);
}
