// Local ESLint rules for the enum standard (docs/standards/02-react-coding.md).
// - every enum member MUST have a string literal initializer
// - the string value MUST equal the member key

const enumValueMatchesKey = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      missingValue: 'Enum member "{{key}}" must be initialised with a string equal to its key.',
      valueMismatch: 'Enum member "{{key}}" must have the value "{{key}}", found "{{value}}".',
    },
  },
  create(context) {
    return {
      TSEnumMember(node) {
        const key = node.id.type === 'Identifier' ? node.id.name : String(node.id.value);
        const initializer = node.initializer;

        if (
          !initializer ||
          initializer.type !== 'Literal' ||
          typeof initializer.value !== 'string'
        ) {
          context.report({ node, messageId: 'missingValue', data: { key } });
          return;
        }

        if (initializer.value !== key) {
          context.report({
            node,
            messageId: 'valueMismatch',
            data: { key, value: initializer.value },
          });
        }
      },
    };
  },
};

export default { rules: { 'enum-value-matches-key': enumValueMatchesKey } };
