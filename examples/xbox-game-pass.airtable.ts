import {
  airtable2html,
  type Airtable2HtmlPreset,
  type AirtableScriptingBase,
} from '../src/index.ts';

declare const base: AirtableScriptingBase;
declare const output: { markdown(value: string): void };

const CONFIG: Airtable2HtmlPreset = {
  records: {
    limit: Number.MAX_SAFE_INTEGER,
  },
  output: {
    format: 'markdown',
  },
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
  sources: {
    tbl6Xno8SQ5hv39nV: {
      view: 'viwXXXXXXXXXXXXXX',
      columns: [
        {
          field: {
            id: 'fldbfDOhKsGX7khac',
            name: 'DateInferred',
          },
          header: 'Date',
          transform: 'date.inferredMonthDay',
        },
        {
          field: { id: 'fldK8uiOyi8NNf38N', name: 'Game' },
          header: 'Game',
        },
        {
          field: { id: 'fldcxF12OhaWbTzR2', name: 'Tiers' },
          header: 'Game Pass Tier(s)',
        },
        {
          field: { id: 'fldshK53iuO9EIGld', name: 'Platforms' },
          header: 'Platform(s)',
          transform: 'xboxGamePass.platforms',
        },
        {
          field: { id: 'fldwNE4saM3HFgJF3', name: 'Notes' },
          header: 'Notes',
        },
      ],
    },
    tbl4o8gkYPplR31gA: {
      view: 'viwYYYYYYYYYYYYYY',
      columns: [
        {
          field: { id: 'fld7kRPVQVydMYXUn', name: 'Game' },
          header: 'Game',
        },
        {
          field: { id: 'fld6MNubTTSazOZc8', name: 'dateAdded' },
          header: 'Added',
        },
        {
          field: {
            id: 'fldQXBZmYhXM3crzA',
            name: 'stintDurationMonths',
          },
          header: 'Stint Duration',
          transform: {
            name: 'duration.monthCount',
            options: { abbreviate: false },
          },
        },
        {
          field: { id: 'fldvwcxwT015ya3c0', name: 'OpenCriticAvg' },
          header: 'OpenCritic Avg.',
          transform: {
            name: 'fallback',
            options: { value: 'N/A' },
          },
        },
        {
          field: { id: 'fldzjDGmHg9wdYqOp', name: 'HowLongToBeat' },
          header: 'How Long To Beat',
          transform: 'howLongToBeat.duration',
        },
      ],
    },
  },
};

const html = await airtable2html({
  base,
  console,
  config: CONFIG,
  table: 'tbl6Xno8SQ5hv39nV',
});

output.markdown(html);
