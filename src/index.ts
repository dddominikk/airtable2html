export { airtable2html, default } from './airtable2html.ts';
export {
  isAirtable2HtmlScriptingOptions,
  resolveAirtableScriptingConfig,
} from './airtable-scripting-config.ts';
export {
  createAirtableTableModel,
  defaults,
  stringifyCellValue,
} from './model.ts';
export { resolveFieldReference } from './fields.ts';
export { airtableScripting } from './adapters/airtable-scripting.ts';
export {
  builtInTransforms,
  createTransformRegistry,
  fallback,
  formatInferredDateAsMonthDay,
  formatMonthCountDuration,
  identity,
  join,
  normalizeHowLongToBeatDuration,
  normalizeXboxGamePassPlatforms,
  regexReplace,
  resolveTransform,
  trim,
} from './transforms/index.ts';
export {
  defaultHtmlOptions,
  escapeHtml,
  renderHtml,
  renderMarkdown,
  wrapHtmlInMarkdown,
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
  Airtable2HtmlPreset,
  Airtable2HtmlScriptingOptions,
  Airtable2HtmlSettings,
  Airtable2HtmlSourcePreset,
  AirtableScriptingConfig,
} from './airtable-scripting-config.ts';
export type {
  FormatMonthCountDurationOptions,
  NormalizeHowLongToBeatDurationOptions,
  NormalizeXboxGamePassPlatformsOptions,
} from './transforms/index.ts';
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
  HtmlPipelineCallback,
  HtmlPipelineContext,
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
