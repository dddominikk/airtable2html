import assert from 'node:assert/strict';
import test from 'node:test';

import {
  airtable2html,
  airtableScripting,
  type AirtableScriptingBase,
  type AirtableScriptingField,
  type AirtableScriptingRecord,
  type AirtableScriptingTable,
} from '../src/index.ts';

const fields: AirtableScriptingField[] = [
  { id: 'fld00000000000001', name: 'Name' },
  { id: 'fld00000000000002', name: 'Notes' },
];

class MockRecord implements AirtableScriptingRecord {
  id = 'rec00000000000001';

  getCellValue(field: AirtableScriptingField | string): unknown {
    const name = typeof field === 'string' ? field : field.name;
    return name === 'Name' ? '<Alpha>' : 'A & B';
  }

  getCellValueAsString(field: AirtableScriptingField | string): string {
    return String(this.getCellValue(field));
  }
}

const table: AirtableScriptingTable = {
  id: 'tbl00000000000001',
  name: 'Games',
  fields,
  views: [],
  getView() {
    throw new Error('Unknown view');
  },
  async selectRecordsAsync() {
    return { records: [new MockRecord()] };
  },
};

const base: AirtableScriptingBase = {
  tables: [table],
  getTable() {
    return table;
  },
};

const adapter = airtableScripting({ base });

test('treats configured headers as HTML while still escaping cell values', async () => {
  const html = await airtable2html({
    adapter,
    source: { table: table.id },
    columns: [
      { field: 'Name', header: '<em>[▲]</em>Name' },
      { field: 'Notes', header: 'Notes' },
    ],
  });

  assert.equal(
    html,
    '<table><thead><tr><th><em>[▲]</em>Name</th><th>Notes</th></tr></thead><tbody><tr><td>&lt;Alpha&gt;</td><td>A &amp; B</td></tr></tbody></table>',
  );
});

test('runs HTML pipeline callbacks serially in configuration order', async () => {
  const calls: number[] = [];

  const html = await airtable2html({
    adapter,
    source: { table: table.id },
    records: { limit: 0 },
    columns: [{ field: 'Name', customFlag: true }],
    pipeline: [
      (value, context) => {
        calls.push(context.index);

        const column = context.config.columns?.[0];
        assert.equal(
          typeof column === 'object' &&
            column !== null &&
            'customFlag' in column &&
            column.customFlag,
          true,
        );

        return `${value}<one>`;
      },
      async (value, context) => {
        calls.push(context.index);
        return `${value}<two>`;
      },
    ],
  });

  assert.deepEqual(calls, [0, 1]);
  assert.match(html, /<\/table><one><two>$/);
});

test('places transformed HTML inside the Markdown fence', async () => {
  const markdown = await airtable2html({
    adapter,
    source: { table: table.id },
    columns: ['Name'],
    output: { format: 'markdown' },
    pipeline: [(html) => `${html}\n<div>after</div>`],
  });

  assert.match(markdown, /<\/table>\n<div>after<\/div>\n```$/);
});

test('rejects non-string pipeline results', async () => {
  await assert.rejects(
    airtable2html({
      adapter,
      source: { table: table.id },
      columns: ['Name'],
      pipeline: [(() => 42) as never],
    }),
    /must return a string/,
  );
});
