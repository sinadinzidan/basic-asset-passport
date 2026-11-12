type InstanceReference = { space: string; externalId: string };

export function getInstanceKey({ space, externalId }: InstanceReference): string {
  return `${space}:${externalId}`;
}

export function isSameInstance(
  instance: InstanceReference,
  other: Partial<InstanceReference> | undefined,
): boolean {
  return other?.space === instance.space && other.externalId === instance.externalId;
}
