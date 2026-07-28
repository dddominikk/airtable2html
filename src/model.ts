import { createTransformRegistry, resolveTransform } from './transforms/index.ts';
import type {
  Airtable2HtmlConfig,
  CellTransform,
  ColumnConfig,
  ColumnInput,
  TableCell,
  TableColumn,
  TableModel,
  TableRow,
} from './types.ts';
import type { ResolvedField } from './adapters/types.ts';

const DEFAULT_FIELD_COUNT = 5;
const DEFAULT_RECORD_LIMIT = 100;

interface ResolvedColumn<RecordHandle = unknown, FieldHandle = unknown> {
  config: ColumnConfig<RecordHandle>;
  field: ResolvedField<FieldHandle>;
  header: string;
  transform: CellTransform<RecordHandle>;
  transformOptions: unknown;
}

function isColumnConfig<RecordHandle>(
  input: ColumnInput<RecordHandle>,
): input is ColumnConfig<RecordHandle> {
  return typeof input === 'object' && input !== null && 'field' in input;
}

function normalizeColumn<RecordHandle>(
  input: ColumnInput<RecordHandle>,
): ColumnConfig<RecordHandle> {
  return isColumnConfig(input) ? input : { field: input };
}

function validateLimit(limit: number): number {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new RangeError('records.limit must be a non-negative safe integer.');
  }

  return limit;
}

export function stringifyCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stringifyCellValue).join(', ');

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function createAirtableTableModel<
  TableHandle,
  ViewHandle,
  FieldHandle,
  RecordHandle,
>(
  config: Airtable2HtmlConfig<
    TableHandle,
    ViewHandle,
    FieldHandle,
    RecordHandle
  >,
): Promise<TableModel> {
  const { adapter } = config;
  const table = adapter.resolveTable(config.source.table);
  const view = config.source.view
    ? adapter.resolveView(table, config.source.view)
    : undefined;
  const availableFields = adapter.listFields(table);

  const columnInputs =
    config.columns ??
    availableFields.slice(0, DEFAULT_FIELD_COUNT).map((field) => field.id);

  if (columnInputs.length === 0) {
    throw new RangeError(
      `No output columns were configured and ${table.name} has no fields.`,
    );
  }

  const registry = createTransformRegistry(config.transforms);
  const resolvedColumns: ResolvedColumn<RecordHandle, FieldHandle>[] =
    columnInputs.map((input) => {
      const column = normalizeColumn(input);
      const field = adapter.resolveField(table, column.field);
      const resolvedTransform = resolveTransform(column.transform, registry);

      return {
        config: column,
        field,
        header: column.header ?? field.name,
        transform: resolvedTransform.transform,
        transformOptions: resolvedTransform.options,
      };
    });

  const uniqueFields = Array.from(
    new Map(
      resolvedColumns.map((column) => [
        column.field.id.toLocaleLowerCase('en-US'),
        column.field,
      ]),
    ).values(),
  );

  const selected = await adapter.selectRecords({
    table,
    ...(view ? { view } : {}),
    fields: uniqueFields,
  });

  const limit = validateLimit(config.records?.limit ?? DEFAULT_RECORD_LIMIT);
  const outputRecords = selected.records.slice(0, limit);

  const rows: TableRow[] = await Promise.all(
    outputRecords.map(async (record, rowIndex) => {
      const recordId = adapter.getRecordId(record);
      const cells: TableCell[] = await Promise.all(
        resolvedColumns.map(async (column, columnIndex) => {
          const rawValue = adapter.getCellValue(record, column.field);
          const stringValue = adapter.getCellValueAsString(record, column.field);
          const inputValue =
            column.config.value === 'raw' ? rawValue : stringValue;
          const transformed = await column.transform(inputValue, {
            rawValue,
            stringValue,
            field: column.field,
            record,
            recordId,
            rowIndex,
            columnIndex,
            options: column.transformOptions,
          });
          const text = stringifyCellValue(transformed);

          return {
            rawValue,
            value: transformed,
            text:
              text === '' && column.config.emptyValue !== undefined
                ? column.config.emptyValue
                : text,
          };
        }),
      );

      return { id: recordId, cells };
    }),
  );

  const columns: TableColumn[] = resolvedColumns.map((column) => ({
    field: column.field,
    header: column.header,
  }));

  return {
    columns,
    rows,
    metadata: {
      table,
      ...(view ? { view } : {}),
      totalRecords: selected.records.length,
      outputRecords: rows.length,
      limit,
      truncated: selected.records.length > rows.length,
    },
  };
}

export const defaults = Object.freeze({
  fieldCount: DEFAULT_FIELD_COUNT,
  recordLimit: DEFAULT_RECORD_LIMIT,
});
