import type {
  FieldReference,
  TableReference,
  ViewReference,
} from '../types.ts';

export interface ResolvedTable<TableHandle = unknown> {
  id: string;
  name: string;
  handle: TableHandle;
}

export interface ResolvedView<ViewHandle = unknown> {
  id: string;
  name: string;
  handle: ViewHandle;
}

export interface ResolvedField<FieldHandle = unknown> {
  id: string;
  name: string;
  type?: string;
  handle: FieldHandle;
}

export interface SelectRecordsRequest<
  TableHandle = unknown,
  ViewHandle = unknown,
  FieldHandle = unknown,
> {
  table: ResolvedTable<TableHandle>;
  view?: ResolvedView<ViewHandle>;
  fields: readonly ResolvedField<FieldHandle>[];
}

export interface SelectRecordsResult<RecordHandle = unknown> {
  records: readonly RecordHandle[];
}

export interface AirtableAdapter<
  TableHandle = unknown,
  ViewHandle = unknown,
  FieldHandle = unknown,
  RecordHandle = unknown,
> {
  resolveTable(reference: TableReference): ResolvedTable<TableHandle>;
  resolveView(
    table: ResolvedTable<TableHandle>,
    reference: ViewReference,
  ): ResolvedView<ViewHandle>;
  listFields(
    table: ResolvedTable<TableHandle>,
  ): readonly ResolvedField<FieldHandle>[];
  resolveField(
    table: ResolvedTable<TableHandle>,
    reference: FieldReference,
  ): ResolvedField<FieldHandle>;
  selectRecords(
    request: SelectRecordsRequest<TableHandle, ViewHandle, FieldHandle>,
  ): Promise<SelectRecordsResult<RecordHandle>>;
  getRecordId(record: RecordHandle): string;
  getCellValue(record: RecordHandle, field: ResolvedField<FieldHandle>): unknown;
  getCellValueAsString(
    record: RecordHandle,
    field: ResolvedField<FieldHandle>,
  ): string;
}
