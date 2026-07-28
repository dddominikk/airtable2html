import type {
  AirtableAdapter,
  ResolvedField,
  ResolvedTable,
  ResolvedView,
} from './adapters/types.ts';

export type TableReference = string | { id?: string; name?: string };
export type ViewReference = string | { id?: string; name?: string };

export type FieldReference =
  | string
  | {
      id?: string;
      name?: string;
      aliases?: readonly string[];
    };

export interface SourceConfig {
  table: TableReference;
  view?: ViewReference;
}

export type CellValueMode = 'string' | 'raw';

export interface CellTransformContext<RecordHandle = unknown> {
  rawValue: unknown;
  stringValue: string;
  field: ResolvedField;
  record: RecordHandle;
  recordId: string;
  rowIndex: number;
  columnIndex: number;
  options: unknown;
}

export type CellTransform<RecordHandle = unknown> = (
  value: unknown,
  context: CellTransformContext<RecordHandle>,
) => unknown | Promise<unknown>;

export type TransformReference<RecordHandle = unknown> =
  | string
  | CellTransform<RecordHandle>
  | {
      name: string;
      options?: unknown;
    };

export interface ColumnConfig<RecordHandle = unknown> {
  field: FieldReference;
  header?: string;
  transform?: TransformReference<RecordHandle>;
  value?: CellValueMode;
  emptyValue?: string;
}

export type ColumnInput<RecordHandle = unknown> =
  | FieldReference
  | ColumnConfig<RecordHandle>;

export interface RecordConfig {
  limit?: number;
}

export type OutputFormat = 'html' | 'markdown';

export interface OutputConfig {
  format?: OutputFormat;
}

export type HtmlAttributeValue = string | number | boolean | null | undefined;
export type HtmlAttributes = Readonly<Record<string, HtmlAttributeValue>>;

export interface HtmlRenderOptions {
  pretty?: boolean;
  escape?: boolean;
  indent?: string;
  tableAttributes?: HtmlAttributes;
  theadAttributes?: HtmlAttributes;
  tbodyAttributes?: HtmlAttributes;
  rowAttributes?: HtmlAttributes;
  headerCellAttributes?: HtmlAttributes;
  cellAttributes?: HtmlAttributes;
}

export interface MarkdownRenderOptions {
  fenced?: boolean;
  language?: string;
}

export interface Airtable2HtmlConfig<
  TableHandle = unknown,
  ViewHandle = unknown,
  FieldHandle = unknown,
  RecordHandle = unknown,
> {
  adapter: AirtableAdapter<TableHandle, ViewHandle, FieldHandle, RecordHandle>;
  source: SourceConfig;
  columns?: readonly ColumnInput<RecordHandle>[];
  records?: RecordConfig;
  transforms?: Readonly<Record<string, CellTransform<RecordHandle>>>;
  output?: OutputConfig;
  html?: HtmlRenderOptions;
  markdown?: MarkdownRenderOptions;
}

export interface TableCell {
  rawValue: unknown;
  value: unknown;
  text: string;
}

export interface TableColumn {
  field: ResolvedField;
  header: string;
}

export interface TableRow {
  id: string;
  cells: readonly TableCell[];
}

export interface TableModel {
  columns: readonly TableColumn[];
  rows: readonly TableRow[];
  metadata: {
    table: ResolvedTable;
    view?: ResolvedView;
    totalRecords: number;
    outputRecords: number;
    limit: number;
    truncated: boolean;
  };
}
