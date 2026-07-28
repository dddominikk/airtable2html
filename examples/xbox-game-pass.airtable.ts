import {
  airtable2html,
  airtableScripting,
  type AirtableScriptingBase,
  type CellTransform,
} from '../src/index.ts';

declare const base: AirtableScriptingBase;
declare const output: { markdown(value: string): void };

const formatMonths: CellTransform = (value) => {
  const totalMonths = Number.parseInt(String(value), 10);
  if (!Number.isFinite(totalMonths) || totalMonths < 0) return '';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];

  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0 || parts.length === 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }

  return parts.join(', ');
};

const xgpPlatforms: CellTransform = (_value, context) => {
  const platforms = context.stringValue.split(/,\s*/u);
  const results: string[] = [];

  if (platforms.includes('Xbox One') && platforms.includes('Series X/S')) {
    results.push('Console');
  } else if (platforms.includes('Xbox One')) {
    results.push('Xbox One');
  } else if (platforms.includes('Series X/S')) {
    results.push('Series X/S');
  }

  for (const platform of ['Cloud', 'Handheld', 'PC']) {
    if (platforms.includes(platform)) results.push(platform);
  }

  return results.sort().join(', ');
};

const html = await airtable2html({
  adapter: airtableScripting({ base }),
  source: {
    table: 'tbl6Xno8SQ5hv39nV',
    view: 'viwXXXXXXXXXXXXXX',
  },
  columns: [
    {
      field: {
        id: 'fldbfDOhKsGX7khac',
        name: 'DateInferred',
      },
      header: 'Date',
      transform: (value) => {
        const text = String(value);
        const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
        return /^\w+ \d+ \d+$/u.test(text)
          ? capitalized.replace(/ \d+$/u, '')
          : capitalized;
      },
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
      transform: 'xgp.platforms',
    },
    {
      field: { id: 'fldwNE4saM3HFgJF3', name: 'Notes' },
      header: 'Notes',
    },
  ],
  transforms: {
    'xgp.platforms': xgpPlatforms,
    'xgp.months': formatMonths,
  },
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

output.markdown(html);
