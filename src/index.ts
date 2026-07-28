export { airtable2html, default } from './airtable2html.ts';
export { createAirtableTableModel, defaults, stringifyCellValue } from './model.ts';
export { resolveFieldReference } from './fields.ts';
export { airtableScripting } from './adapters/airtable-scripting.ts';
export {
  builtInTransforms,
  createTransformRegistry,
  fallback,
  identity,
  join,
  regexReplace,
  resolveTransform,
  trim,
} from './transforms/index.ts';
export {
  defaultHtmlOptions,
  escapeHtml,
  renderHtml,
  renderMarkdown,
} from './renderers/index.ts';

export type {
  AirtableAdapter,
  ResolvedField,
  ResolvedTable,
  ResolvedView,
  SelectRecordsRequest,
  SelectRecordsResult,
} from './adapters/types.ts';
export type {
  AirtableScriptingAdapterOptions,
  AirtableScriptingBase,
  AirtableScriptingField,
  AirtableScriptingQueryResult,
  AirtableScriptingRecord,
  AirtableScriptingTable,
  AirtableScriptingView,
} from './adapters/airtable-scripting.ts';
export type {
  Airtable2HtmlConfig,
  CellTransform,
  CellTransformContext,
  CellValueMode,
  ColumnConfig,
  ColumnInput,
  FieldReference,
  HtmlAttributes,
  HtmlAttributeValue,
  HtmlRenderOptions,
  MarkdownRenderOptions,
  OutputConfig,
  OutputFormat,
  RecordConfig,
  SourceConfig,
  TableCell,
  TableColumn,
  TableModel,
  TableReference,
  TableRow,
  TransformReference,
  ViewReference,
} from './types.ts';
