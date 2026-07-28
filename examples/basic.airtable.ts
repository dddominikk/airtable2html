import {
  airtable2html,
  airtableScripting,
  type AirtableScriptingBase,
} from '../src/index.ts';

declare const base: AirtableScriptingBase;
declare const output: { markdown(value: string): void };

const html = await airtable2html({
  adapter: airtableScripting({ base }),
  source: {
    table: 'tblXXXXXXXXXXXXXX',
    view: 'viwXXXXXXXXXXXXXX',
  },
});

output.markdown(html);
