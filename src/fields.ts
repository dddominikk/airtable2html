import type { ResolvedField } from './adapters/types.ts';
import type { FieldReference } from './types.ts';

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function describeReference(reference: FieldReference): string {
  if (typeof reference === 'string') return JSON.stringify(reference);

  return JSON.stringify({
    ...(reference.id ? { id: reference.id } : {}),
    ...(reference.name ? { name: reference.name } : {}),
    ...(reference.aliases ? { aliases: reference.aliases } : {}),
  });
}

export function resolveFieldReference<FieldHandle>(
  fields: readonly ResolvedField<FieldHandle>[],
  reference: FieldReference,
  tableName = 'unknown table',
): ResolvedField<FieldHandle> {
  const byId = new Map(fields.map((field) => [normalize(field.id), field]));
  const byName = new Map(fields.map((field) => [normalize(field.name), field]));

  if (typeof reference === 'string') {
    const key = normalize(reference);
    const match = byId.get(key) ?? byName.get(key);

    if (match) return match;
  } else {
    if (reference.id) {
      const match = byId.get(normalize(reference.id));
      if (match) return match;
    }

    if (reference.name) {
      const match = byName.get(normalize(reference.name));
      if (match) return match;
    }

    for (const alias of reference.aliases ?? []) {
      const match = byName.get(normalize(alias));
      if (match) return match;
    }
  }

  const available = fields
    .map((field) => `${field.name} (${field.id})`)
    .join(', ');

  throw new ReferenceError(
    `Unable to resolve field ${describeReference(reference)} in ${tableName}. ` +
      `Available fields: ${available || '(none)'}`,
  );
}
