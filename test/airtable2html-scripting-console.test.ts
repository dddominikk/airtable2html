import assert from 'node:assert/strict';
import test from 'node:test';

import {
  airtable2html,
  type Airtable2HtmlConsole,
  type AirtableScriptingBase,
  type AirtableScriptingField,
  type AirtableScriptingRecord,
  type AirtableScriptingTable,
  type AirtableScriptingView,
} from '../src/index.ts';

const field: AirtableScriptingField = {
  id: 'fldName000000001',
  name: 'Name',
  type: 'singleLineText',
};

const record: AirtableScriptingRecord = {
  id: 'recGame000000001',
  getCellValue() {
    return 'Halo';
  },
  getCellValueAsString() {
    return 'Halo';
  },
};

const view: AirtableScriptingView = {
  id: 'viwGames00000001',
  name: 'Grid view',
  async selectRecordsAsync() {
    return { records: [record] };
  },
};

const table: AirtableScriptingTable = {
  id: 'tblGames00000001',
  name: 'Games',
  fields: [field],
  views: [view],
  getView() {
    return view;
  },
  async selectRecordsAsync() {
    return { records: [record] };
  },
};

const base: AirtableScriptingBase = {
  tables: [table],
  getTable() {
    return table;
  },
};

test('routes unknown-source warnings through the injected scripting console', async () => {
  const warnings: string[] = [];
  const scriptingConsole: Airtable2HtmlConsole = {
    warn(...values) {
      warnings.push(values.map(String).join(' '));
    },
  };

  const html = await airtable2html({
    base,
    console: scriptingConsole,
    config: {
      columns: ['Name'],
      sources: {
        OtherTable: {},
      },
    },
  });

  assert.match(html, /<td>Halo<\/td>/);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? '', /selected table "Games"/);
  assert.match(warnings[0] ?? '', /Rendering will continue/);
});
