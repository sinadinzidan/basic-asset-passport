export function isEnumValue<Value extends string>(
  enumObject: Record<string, Value>,
  value: unknown,
): value is Value {
  return typeof value === 'string' && Object.values(enumObject).some((member) => member === value);
}
