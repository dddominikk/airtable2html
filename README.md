# airtable2html

Convert an Airtable table or view into an HTML table with configurable columns,
field resolution, transforms, rendering, and output formatting.

The package is written as native, erasable TypeScript. Development and tests run
directly from `.ts` source through Node's built-in type stripping. Compilation is
optional and only performed by `npm run emit`.

## Defaults

When omitted, `airtable2html` uses:

- the first **five fields** in the selected table;
- the first **100 records** returned by the table or view;
- Airtable string-form cell values;
- escaped, minified HTML output;
- field names as column headers.

A view affects record filtering, sorting, and ordering. It does not determine the
output fields.

## Airtable usage

```ts
const { airtable2html, airtableScripting } = await import(
  'https://esm.sh/gh/dddominikk/airtable2html@<commit>'
);

const config = input.config({
  title: 'Export Airtable to HTML',
  items: [
    input.config.table('table', { label: 'Table' }),
    input.config.view('view', {
      label: 'View',
      parentTable: 'table',
    }),
  ],
});

const html = await airtable2html({
  adapter: airtableScripting({ base }),
  source: {
    table: config.table,
    view: config.view,
  },
});

output.markdown(html);
```

Pin production imports to a commit hash or release tag rather than the default
branch.

## Explicit columns

Columns are emitted in configuration order. Field references are resolved
case-insensitively by ID, name, then aliases. Supplying both the immutable field
ID and current name gives rename resistance plus readable configuration.

```ts
const html = await airtable2html({
  adapter: airtableScripting({ base }),
  source: {
    table: 'tbl6Xno8SQ5hv39nV',
    view: 'viwXXXXXXXXXXXXXX',
  },
  columns: [
    {
      field: {
        id: 'fldK8uiOyi8NNf38N',
        name: 'Game',
        aliases: ['Title'],
      },
      header: 'Game',
    },
    {
      field: 'fldshK53iuO9EIGld',
      header: 'Platform(s)',
      transform: 'xgp.platforms',
    },
  ],
  transforms: {
    'xgp.platforms': (_value, context) =>
      context.stringValue.split(/,\\s*/u).sort().join(', '),
  },
});
```

## Output and formatting

```ts
const markdown = await airtable2html({
  adapter: airtableScripting({ base }),
  source: { table: 'Games', view: 'Published' },
  records: { limit: 50 },
  output: { format: 'markdown' },
  html: {
    pretty: true,
    tableAttributes: {
      border: 1,
      cellpadding: 1,
      cellspacing: 1,
    },
    headerCellAttributes: { style: 'text-align:center' },
    cellAttributes: { style: 'text-align:center' },
  },
});
```

Supported output formats are `html` and fenced `markdown`.

## Model and renderer APIs

The convenience function is composed from two independent stages:

```ts
const model = await createAirtableTableModel(config);
const html = renderHtml(model, { pretty: true });
const markdown = renderMarkdown(model);
```

The model preserves resolved field metadata, raw and transformed cell values,
record IDs, record counts, and truncation state. Custom renderers can consume the
same model without querying Airtable again.

## Transforms

A transform can be an inline function, a named function in `transforms`, or a
built-in transform reference with options.

Built-ins:

- `identity`
- `fallback`
- `join`
- `regexReplace`
- `trim`

```ts
columns: [
  {
    field: 'OpenCriticAvg',
    transform: {
      name: 'fallback',
      options: { value: 'N/A', trim: true },
    },
  },
  {
    field: 'Duration',
    transform: {
      name: 'regexReplace',
      options: {
        pattern: '^(\\d+)\\s*-\\s*(\\d+)$',
        replacement: '$1–$2 hours',
      },
    },
  },
]
```

Transform context includes the raw value, Airtable string value, resolved field,
record, record ID, row and column indexes, and transform options.

## Development

Requires Node.js 22.18 or newer.

```sh
npm install
npm run validate
```

No build step is used for normal development:

```sh
node examples/example.ts
node --test test/*.test.ts
```

Type-check without emitting:

```sh
npm run check
```

Explicitly emit JavaScript and declarations:

```sh
npm run emit
```

Generated files are written to `dist/` and are not used by the GitHub/esm.sh
source entry point.
