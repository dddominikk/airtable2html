import assert from 'node:assert/strict';
import test from 'node:test';

import {
  airtable2html,
  airtableScripting,
  createAirtableTableModel,
  renderMarkdown,
  type AirtableScriptingBase,
  type AirtableScriptingField,
  type AirtableScriptingRecord,
  type AirtableScriptingTable,
  type AirtableScriptingView,
} from '../src/index.ts';

const fields: AirtableScriptingField[] = Array.from(
  { length: 7 },
  (_, index) => ({
    id: `fld${String(index + 1).padStart(14, '0')}`,
    name: `Field ${index + 1}`,
    type: 'singleLineText',
  }),
);

class MockRecord implements AirtableScriptingRecord {
  id: string;
  readonly values: Readonly<Record<string, unknown>>;

  constructor(id: string, values: Readonly<Record<string, unknown>>) {
    this.id = id;
    this.values = values;
  }

  getCellValue(field: AirtableScriptingField | string): unknown {
    const name = typeof field === 'string' ? field : field.name;
    return this.values[name];
  }

  getCellValueAsString(field: AirtableScriptingField | string): string {
    const value = this.getCellValue(field);
    return value === null || value === undefined ? '' : String(value);
  }
}

function selectFields(
  records: readonly AirtableScriptingRecord[],
  _options?: { fields?: readonly (AirtableScriptingField | string)[] },
) {
  return Promise.resolve({ records });
}

function createFixture() {
  const records = Array.from(
    { length: 120 },
    (_, index) =>
      new MockRecord(`rec${String(index + 1).padStart(14, '0')}`, {
        'Field 1': index === 0 ? '<Alpha & Beta>' : `Row ${index + 1}`,
        'Field 2': index + 1,
        'Field 3': `C${index + 1}`,
        'Field 4': `D${index + 1}`,
        'Field 5': `E${index + 1}`,
        'Field 6': `F${index + 1}`,
        'Field 7': `G${index + 1}`,
      }),
  );

  const viewRecords = records.slice(10, 13);
  const view: AirtableScriptingView = {
    id: 'viw00000000000001',
    name: 'Selected View',
    selectRecordsAsync: (options) => selectFields(viewRecords, options),
  };

  const table: AirtableScriptingTable = {
    id: 'tbl00000000000001',
    name: 'Games',
    fields,
    views: [view],
    getView(reference) {
      if (
        reference.toLocaleLowerCase('en-US') === view.id.toLocaleLowerCase('en-US') ||
        reference.toLocaleLowerCase('en-US') === view.name.toLocaleLowerCase('en-US')
      ) {
        return view;
      }

      throw new Error('Unknown view');
    },
    selectRecordsAsync: (options) => selectFields(records, options),
  };

  const base: AirtableScriptingBase = {
    tables: [table],
    getTable(reference) {
      if (
        reference.toLocaleLowerCase('en-US') === table.id.toLocaleLowerCase('en-US') ||
        reference.toLocaleLowerCase('en-US') === table.name.toLocaleLowerCase('en-US')
      ) {
        return table;
      }

      throw new Error('Unknown table');
    },
  };

  return { adapter: airtableScripting({ base }), records, table, view };
}

test('defaults to the first five table fields and 100 records', async () => {
  const { adapter } = createFixture();
  const model = await createAirtableTableModel({
    adapter,
    source: { table: 'games' },
  });

  assert.deepEqual(
    model.columns.map((column) => column.header),
    ['Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5'],
  );
  assert.equal(model.rows.length, 100);
  assert.equal(model.metadata.totalRecords, 120);
  assert.equal(model.metadata.truncated, true);
});

test('honors view filtering and ordering without deriving columns from the view', async () => {
  const { adapter } = createFixture();
  const model = await createAirtableTableModel({
    adapter,
    source: {
      table: 'TBL00000000000001',
      view: 'selected view',
    },
  });

  assert.equal(model.rows.length, 3);
  assert.equal(model.rows[0]?.cells[0]?.text, 'Row 11');
  assert.equal(model.columns.length, 5);
  assert.equal(model.metadata.view?.name, 'Selected View');
});

test('resolves explicit field references case-insensitively by ID, name, and alias', async () => {
  const { adapter } = createFixture();
  const model = await createAirtableTableModel({
    adapter,
    source: { table: 'Games' },
    records: { limit: 1 },
    columns: [
      { field: 'FLD00000000000006', header: 'Six' },
      { field: { name: 'field 7' }, header: 'Seven' },
      {
        field: {
          id: 'fld-does-not-exist',
          aliases: ['FIELD 2'],
        },
        header: 'Aliased',
      },
    ],
  });

  assert.deepEqual(
    model.rows[0]?.cells.map((cell) => cell.text),
    ['F1', 'G1', '1'],
  );
});

test('supports named and inline transforms', async () => {
  const { adapter } = createFixture();
  const model = await createAirtableTableModel({
    adapter,
    source: { table: 'Games' },
    records: { limit: 1 },
    transforms: {
      upper: (value) => String(value).toUpperCase(),
    },
    columns: [
      { field: 'Field 3', transform: 'upper' },
      {
        field: 'Field 4',
        transform: {
          name: 'regexReplace',
          options: { pattern: '^D', replacement: 'Changed-' },
        },
      },
      {
        field: 'Field 5',
        transform: (value, context) => `${value}:${context.rowIndex}`,
      },
    ],
  });

  assert.deepEqual(
    model.rows[0]?.cells.map((cell) => cell.text),
    ['C1', 'Changed-1', 'E1:0'],
  );
});

test('renders escaped minified HTML by default', async () => {
  const { adapter } = createFixture();
  const html = await airtable2html({
    adapter,
    source: { table: 'Games' },
    records: { limit: 1 },
    columns: ['Field 1'],
  });

  assert.equal(
    html,
    '<table><thead><tr><th>Field 1</th></tr></thead><tbody><tr><td>&lt;Alpha &amp; Beta&gt;</td></tr></tbody></table>',
  );
});

test('renders prettified fenced Markdown when selected', async () => {
  const { adapter } = createFixture();
  const model = await createAirtableTableModel({
    adapter,
    source: { table: 'Games' },
    records: { limit: 1 },
    columns: ['Field 2'],
  });
  const markdown = renderMarkdown(model);

  assert.match(markdown, /^```html\n<table>/);
  assert.match(markdown, /\n\t<thead>/);
  assert.match(markdown, /<td>1<\/td>/);
  assert.match(markdown, /<\/table>\n```$/);
});
