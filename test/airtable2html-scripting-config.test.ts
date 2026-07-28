import assert from 'node:assert/strict';
import test from 'node:test';

import {
  airtable2html,
  resolveAirtableScriptingConfig,
  type Airtable2HtmlPreset,
  type AirtableScriptingBase,
  type AirtableScriptingField,
  type AirtableScriptingRecord,
  type AirtableScriptingTable,
  type AirtableScriptingView,
} from '../src/index.ts';

const fields: AirtableScriptingField[] = [
  { id: 'fldName000000001', name: 'Name', type: 'singleLineText' },
  { id: 'fldValue00000001', name: 'Value', type: 'singleLineText' },
];

class MockRecord implements AirtableScriptingRecord {
  readonly id: string;
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

function makeView(
  id: string,
  name: string,
  records: readonly AirtableScriptingRecord[],
): AirtableScriptingView {
  return {
    id,
    name,
    async selectRecordsAsync() {
      return { records };
    },
  };
}

function makeTable(
  id: string,
  name: string,
  records: readonly AirtableScriptingRecord[],
  views: readonly AirtableScriptingView[],
): AirtableScriptingTable {
  return {
    id,
    name,
    fields,
    views,
    getView(reference) {
      const normalized = reference.toLocaleLowerCase('en-US');
      const view = views.find(
        (candidate) =>
          candidate.id.toLocaleLowerCase('en-US') === normalized ||
          candidate.name.toLocaleLowerCase('en-US') === normalized,
      );

      if (!view) throw new Error('Unknown view');
      return view;
    },
    async selectRecordsAsync() {
      return { records };
    },
  };
}

function createFixture() {
  const firstRecord = new MockRecord('recFirst0000001', {
    Name: 'First view record',
    Value: 'First value',
  });
  const secondDefaultRecord = new MockRecord('recSecond000001', {
    Name: 'Second default record',
    Value: 'Second default value',
  });
  const secondSpecialRecord = new MockRecord('recSecond000002', {
    Name: 'Second special record',
    Value: 'Second special value',
  });

  const firstView = makeView(
    'viwFirst00000001',
    'First View',
    [firstRecord],
  );
  const secondDefaultView = makeView(
    'viwSecond0000001',
    'Default View',
    [secondDefaultRecord],
  );
  const secondSpecialView = makeView(
    'viwSecond0000002',
    'Special View',
    [secondSpecialRecord],
  );

  const firstTable = makeTable(
    'tblFirst00000001',
    'First Table',
    [firstRecord],
    [firstView],
  );
  const secondTable = makeTable(
    'tblSecond0000001',
    'Second Table',
    [secondDefaultRecord, secondSpecialRecord],
    [secondDefaultView, secondSpecialView],
  );

  const tables = [firstTable, secondTable];
  const base: AirtableScriptingBase = {
    tables,
    getTable(reference) {
      const normalized = reference.toLocaleLowerCase('en-US');
      const table = tables.find(
        (candidate) =>
          candidate.id.toLocaleLowerCase('en-US') === normalized ||
          candidate.name.toLocaleLowerCase('en-US') === normalized,
      );

      if (!table) throw new Error('Unknown table');
      return table;
    },
  };

  return { base };
}

test('defaults to the first table and its first view', async () => {
  const { base } = createFixture();
  const html = await airtable2html({
    base,
    config: {
      columns: [{ field: 'Name', header: '<em>Name</em>' }],
    },
  });

  assert.match(html, /<th><em>Name<\/em><\/th>/);
  assert.match(html, /First view record/);
  assert.doesNotMatch(html, /Second default record/);
});

test('inherits top-level settings when a source does not override them', async () => {
  const { base } = createFixture();
  const config: Airtable2HtmlPreset = {
    columns: [{ field: 'Name', header: 'Default Name' }],
    pipeline: [(html) => `${html}\n<!-- default pipeline -->`],
    html: {
      tableAttributes: { border: 1 },
      cellAttributes: { class: 'shared-cell' },
    },
    sources: {
      tblSecond0000001: {
        view: 'SPECIAL VIEW',
        records: { limit: 1 },
      },
    },
  };

  const html = await airtable2html({
    base,
    config,
    table: 'second table',
  });

  assert.match(html, /^<table border="1">/);
  assert.match(html, /<th>Default Name<\/th>/);
  assert.match(html, /class="shared-cell">Second special record/);
  assert.match(html, /<!-- default pipeline -->$/);
});

test('source settings override defaults and nested HTML settings merge', async () => {
  const { base } = createFixture();
  const config: Airtable2HtmlPreset = {
    columns: [{ field: 'Name', header: 'Default Name' }],
    records: { limit: 5 },
    html: {
      pretty: false,
      tableAttributes: { border: 1 },
      cellAttributes: { class: 'shared-cell' },
    },
    sources: {
      second: {
        table: { name: 'SECOND TABLE' },
        view: 'special view',
        columns: [{ field: 'Value', header: 'Source Value' }],
        records: { limit: 1 },
        html: {
          pretty: true,
          tableAttributes: { cellpadding: 2 },
        },
      },
    },
  };

  const resolved = resolveAirtableScriptingConfig({
    base,
    config,
    table: 'TBLSECOND0000001',
  });

  assert.equal(resolved.source.table, 'tblSecond0000001');
  assert.equal(resolved.source.view, 'viwSecond0000002');
  assert.equal(resolved.columns?.[0]?.header, 'Source Value');
  assert.equal(resolved.records?.limit, 1);
  assert.deepEqual(resolved.html?.tableAttributes, {
    border: 1,
    cellpadding: 2,
  });
  assert.deepEqual(resolved.html?.cellAttributes, { class: 'shared-cell' });

  const html = await airtable2html({
    base,
    config,
    table: 'TBLSECOND0000001',
  });

  assert.match(html, /^<table border="1" cellpadding="2">\n/);
  assert.match(html, /<th>Source Value<\/th>/);
  assert.match(html, /class="shared-cell">Second special value/);
});

test('an explicit view overrides the matched source default view', async () => {
  const { base } = createFixture();
  const html = await airtable2html({
    base,
    table: 'Second Table',
    view: 'DEFAULT VIEW',
    config: {
      columns: [{ field: 'Name' }],
      sources: {
        tblSecond0000001: {
          view: 'Special View',
          columns: [{ field: 'Value', header: 'Configured Value' }],
        },
      },
    },
  });

  assert.match(html, /<th>Configured Value<\/th>/);
  assert.match(html, /Second default value/);
  assert.doesNotMatch(html, /Second special value/);
});
