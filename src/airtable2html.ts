import { createAirtableTableModel } from './model.ts';
import { renderHtml, renderMarkdown } from './renderers/index.ts';
import type { Airtable2HtmlConfig } from './types.ts';

export async function airtable2html<
  TableHandle,
  ViewHandle,
  FieldHandle,
  RecordHandle,
>(
  config: Airtable2HtmlConfig<
    TableHandle,
    ViewHandle,
    FieldHandle,
    RecordHandle
  >,
): Promise<string> {
  const model = await createAirtableTableModel(config);

  return config.output?.format === 'markdown'
    ? renderMarkdown(model, config.html, config.markdown)
    : renderHtml(model, config.html);
}

export default airtable2html;
