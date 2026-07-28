import { resolveFieldReference } from '../fields.ts';
import type {
  AirtableAdapter,
  ResolvedField,
  ResolvedTable,
  ResolvedView,
  SelectRecordsRequest,
} from './types.ts';
import type {
  FieldReference,
  TableReference,
  ViewReference,
} from '../types.ts';

export interface AirtableScriptingField {
  id: string;
  name: string;
  type?: string;
}

export interface AirtableScriptingRecord {
  id: string;
  getCellValue(field: AirtableScriptingField | string): unknown;
  getCellValueAsString(field: AirtableScriptingField | string): string;
}

export interface AirtableScriptingQueryResult {
  records: readonly AirtableScriptingRecord[];
}

export interface AirtableScriptingView {
  id: string;
  name: string;
  selectRecordsAsync(options?: {
    fields?: readonly (AirtableScriptingField | string)[];
  }): Promise<AirtableScriptingQueryResult>;
}

export interface AirtableScriptingTable {
  id: string;
  name: string;
  fields: readonly AirtableScriptingField[];
  views?: readonly AirtableScriptingView[];
  getView(reference: string): AirtableScriptingView;
  selectRecordsAsync(options?: {
    fields?: readonly (AirtableScriptingField | string)[];
  }): Promise<AirtableScriptingQueryResult>;
}

export interface AirtableScriptingBase {
  tables?: readonly AirtableScriptingTable[];
  getTable(reference: string): AirtableScriptingTable;
}

export interface AirtableScriptingAdapterOptions {
  base: AirtableScriptingBase;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function resolveNamedObject<T extends { id: string; name: string }>(
  collection: readonly T[] | undefined,
  reference: string | { id?: string; name?: string },
  getFallback: (value: string) => T,
  kind: string,
): T {
  const values = collection ?? [];
  const id = typeof reference === 'string' ? reference : reference.id;
  const name = typeof reference === 'string' ? reference : reference.name;

  if (id) {
    const match = values.find((value) => normalize(value.id) === normalize(id));
    if (match) return match;
  }

  if (name) {
    const match = values.find(
      (value) => normalize(value.name) === normalize(name),
    );
    if (match) return match;
  }

  for (const candidate of [id, name]) {
    if (!candidate) continue;

    try {
      return getFallback(candidate);
    } catch {
      // Try the next candidate before returning a descriptive error.
    }
  }

  throw new ReferenceError(
    `Unable to resolve ${kind} ${JSON.stringify(reference)}.`,
  );
}

function wrapTable(table: AirtableScriptingTable): ResolvedTable<AirtableScriptingTable> {
  return { id: table.id, name: table.name, handle: table };
}

function wrapView(view: AirtableScriptingView): ResolvedView<AirtableScriptingView> {
  return { id: view.id, name: view.name, handle: view };
}

function wrapField(
  field: AirtableScriptingField,
): ResolvedField<AirtableScriptingField> {
  return {
    id: field.id,
    name: field.name,
    ...(field.type ? { type: field.type } : {}),
    handle: field,
  };
}

export function airtableScripting(
  options: AirtableScriptingAdapterOptions,
): AirtableAdapter<
  AirtableScriptingTable,
  AirtableScriptingView,
  AirtableScriptingField,
  AirtableScriptingRecord
> {
  const { base } = options;

  return {
    resolveTable(reference: TableReference) {
      const table = resolveNamedObject(
        base.tables,
        reference,
        (value) => base.getTable(value),
        'table',
      );

      return wrapTable(table);
    },

    resolveView(
      table: ResolvedTable<AirtableScriptingTable>,
      reference: ViewReference,
    ) {
      const view = resolveNamedObject(
        table.handle.views,
        reference,
        (value) => table.handle.getView(value),
        'view',
      );

      return wrapView(view);
    },

    listFields(table: ResolvedTable<AirtableScriptingTable>) {
      return table.handle.fields.map(wrapField);
    },

    resolveField(
      table: ResolvedTable<AirtableScriptingTable>,
      reference: FieldReference,
    ) {
      return resolveFieldReference(
        table.handle.fields.map(wrapField),
        reference,
        table.name,
      );
    },

    async selectRecords(
      request: SelectRecordsRequest<
        AirtableScriptingTable,
        AirtableScriptingView,
        AirtableScriptingField
      >,
    ) {
      const source = request.view?.handle ?? request.table.handle;
      const query = await source.selectRecordsAsync({
        fields: request.fields.map((field) => field.handle),
      });

      return { records: query.records };
    },

    getRecordId(record: AirtableScriptingRecord) {
      return record.id;
    },

    getCellValue(
      record: AirtableScriptingRecord,
      field: ResolvedField<AirtableScriptingField>,
    ) {
      return record.getCellValue(field.handle);
    },

    getCellValueAsString(
      record: AirtableScriptingRecord,
      field: ResolvedField<AirtableScriptingField>,
    ) {
      return record.getCellValueAsString(field.handle);
    },
  };
}
