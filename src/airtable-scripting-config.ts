import { airtableScripting } from './adapters/airtable-scripting.ts';
import type {
  AirtableScriptingBase,
  AirtableScriptingField,
  AirtableScriptingRecord,
  AirtableScriptingTable,
  AirtableScriptingView,
} from './adapters/airtable-scripting.ts';
import type {
  Airtable2HtmlConfig,
  HtmlAttributes,
  HtmlRenderOptions,
  TableReference,
  ViewReference,
} from './types.ts';

export type AirtableScriptingConfig = Airtable2HtmlConfig<
  AirtableScriptingTable,
  AirtableScriptingView,
  AirtableScriptingField,
  AirtableScriptingRecord
>;

export type Airtable2HtmlSettings = Omit<
  AirtableScriptingConfig,
  'adapter' | 'source'
>;

export type Airtable2HtmlSourcePreset = Partial<Airtable2HtmlSettings> & {
  table?: TableReference;
  view?: ViewReference;
};

export type UnknownSourceAction = 'throw' | 'warn' | 'ignore';

export type Airtable2HtmlPreset = Partial<Airtable2HtmlSettings> & {
  sources?: Readonly<Record<string, Airtable2HtmlSourcePreset>>;
  unknownSourceAction?: UnknownSourceAction;
};

export interface Airtable2HtmlScriptingOptions {
  base: AirtableScriptingBase;
  config?: Airtable2HtmlPreset;
  table?: TableReference;
  view?: ViewReference;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function referenceMatches(
  reference: TableReference | ViewReference,
  value: { id: string; name: string },
): boolean {
  const candidates =
    typeof reference === 'string'
      ? [reference]
      : [reference.id, reference.name].filter(
          (candidate): candidate is string => typeof candidate === 'string',
        );

  const id = normalize(value.id);
  const name = normalize(value.name);

  return candidates.some((candidate) => {
    const normalized = normalize(candidate);
    return normalized === id || normalized === name;
  });
}

function resolveUnknownSourceAction(value: unknown): UnknownSourceAction {
  const action = value ?? 'warn';

  if (action === 'throw' || action === 'warn' || action === 'ignore') {
    return action;
  }

  throw new TypeError(
    'config.unknownSourceAction must be "throw", "warn", or "ignore".',
  );
}

function handleUnknownSource(
  config: Airtable2HtmlPreset,
  table: { id: string; name: string },
  sourcePreset: Airtable2HtmlSourcePreset | undefined,
  action: UnknownSourceAction,
): void {
  const hasConfiguredSources = Object.keys(config.sources ?? {}).length > 0;

  if (!hasConfiguredSources || sourcePreset || action === 'ignore') return;

  const tableDescription = `"${table.name}" (${table.id})`;

  if (action === 'throw') {
    throw new ReferenceError(
      `airtable2html selected table ${tableDescription}, but no matching ` +
        'entry was found in config.sources and config.unknownSourceAction ' +
        'is "throw".',
    );
  }

  console.warn(
    `airtable2html selected table ${tableDescription}, but no matching ` +
      'entry was found in config.sources. Rendering will continue because ' +
      'config.unknownSourceAction is not "throw" (resolved action: "warn").',
  );
}

function mergeObjects<T extends object>(
  defaults: T | undefined,
  overrides: T | undefined,
): T | undefined {
  if (!defaults && !overrides) return undefined;
  return { ...defaults, ...overrides } as T;
}

function mergeAttributes(
  defaults: HtmlAttributes | undefined,
  overrides: HtmlAttributes | undefined,
): HtmlAttributes | undefined {
  return mergeObjects(defaults, overrides);
}

function mergeHtmlOptions(
  defaults: HtmlRenderOptions | undefined,
  overrides: HtmlRenderOptions | undefined,
): HtmlRenderOptions | undefined {
  if (!defaults && !overrides) return undefined;

  const tableAttributes = mergeAttributes(
    defaults?.tableAttributes,
    overrides?.tableAttributes,
  );
  const theadAttributes = mergeAttributes(
    defaults?.theadAttributes,
    overrides?.theadAttributes,
  );
  const tbodyAttributes = mergeAttributes(
    defaults?.tbodyAttributes,
    overrides?.tbodyAttributes,
  );
  const rowAttributes = mergeAttributes(
    defaults?.rowAttributes,
    overrides?.rowAttributes,
  );
  const headerCellAttributes = mergeAttributes(
    defaults?.headerCellAttributes,
    overrides?.headerCellAttributes,
  );
  const cellAttributes = mergeAttributes(
    defaults?.cellAttributes,
    overrides?.cellAttributes,
  );

  return {
    ...defaults,
    ...overrides,
    ...(tableAttributes ? { tableAttributes } : {}),
    ...(theadAttributes ? { theadAttributes } : {}),
    ...(tbodyAttributes ? { tbodyAttributes } : {}),
    ...(rowAttributes ? { rowAttributes } : {}),
    ...(headerCellAttributes ? { headerCellAttributes } : {}),
    ...(cellAttributes ? { cellAttributes } : {}),
  };
}

function mergeSettings(
  defaults: Partial<Airtable2HtmlSettings>,
  overrides: Partial<Airtable2HtmlSettings>,
): Airtable2HtmlSettings {
  const columns = overrides.columns ?? defaults.columns;
  const records = mergeObjects(defaults.records, overrides.records);
  const output = mergeObjects(defaults.output, overrides.output);
  const html = mergeHtmlOptions(defaults.html, overrides.html);
  const markdown = mergeObjects(defaults.markdown, overrides.markdown);
  const transforms = mergeObjects(defaults.transforms, overrides.transforms);
  const pipeline = overrides.pipeline ?? defaults.pipeline;

  return {
    ...(columns !== undefined ? { columns } : {}),
    ...(records ? { records } : {}),
    ...(transforms ? { transforms } : {}),
    ...(pipeline !== undefined ? { pipeline } : {}),
    ...(output ? { output } : {}),
    ...(html ? { html } : {}),
    ...(markdown ? { markdown } : {}),
  };
}

function findSourcePreset(
  config: Airtable2HtmlPreset,
  table: { id: string; name: string },
): Airtable2HtmlSourcePreset | undefined {
  for (const [key, source] of Object.entries(config.sources ?? {})) {
    const reference = source.table ?? key;
    if (referenceMatches(reference, table)) return source;
  }

  return undefined;
}

export function resolveAirtableScriptingConfig(
  options: Airtable2HtmlScriptingOptions,
): AirtableScriptingConfig {
  const { base } = options;
  const preset = options.config ?? {};
  const adapter = airtableScripting({ base });
  const unknownSourceAction = resolveUnknownSourceAction(
    preset.unknownSourceAction,
  );

  const firstTable = base.tables?.[0];
  const tableReference = options.table ?? firstTable?.id;

  if (!tableReference) {
    throw new RangeError(
      'airtable2html could not select a table because base.tables is empty.',
    );
  }

  const table = adapter.resolveTable(tableReference);
  const sourcePreset = findSourcePreset(preset, table);

  handleUnknownSource(preset, table, sourcePreset, unknownSourceAction);

  const firstView = table.handle.views?.[0];
  const viewReference = options.view ?? sourcePreset?.view ?? firstView?.id;
  const view = viewReference
    ? adapter.resolveView(table, viewReference)
    : undefined;

  const {
    sources: _sources,
    unknownSourceAction: _unknownSourceAction,
    ...defaultSettings
  } = preset;
  const {
    table: _sourceTable,
    view: _sourceView,
    ...sourceSettings
  } = sourcePreset ?? {};
  const settings = mergeSettings(defaultSettings, sourceSettings);

  return {
    adapter,
    source: {
      table: table.id,
      ...(view ? { view: view.id } : {}),
    },
    ...settings,
  };
}

export function isAirtable2HtmlScriptingOptions(
  input: Airtable2HtmlScriptingOptions | AirtableScriptingConfig,
): input is Airtable2HtmlScriptingOptions {
  return 'base' in input && !('adapter' in input);
}
