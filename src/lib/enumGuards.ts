/** Narrows an unknown value (from host state, storage or UI events) to a member value of a string enum. */
export function isEnumValue<EnumObject extends Record<string, string>>(enumObject: EnumObject, value: unknown): value is EnumObject[keyof EnumObject] {
  return Object.values(enumObject).some((memberValue) => memberValue === value);
}

/** Maps a stored value back to its enum member, or undefined when the stored value is not one of them. */
export function fromStoredValue<Member extends string>(
  enumObject: Record<string, Member>,
  storedValues: Record<Member, string>,
  stored: unknown
): Member | undefined {
  return Object.values(enumObject).find((member) => storedValues[member] === stored);
}
