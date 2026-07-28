import { createAirtableTableModel } from './model.ts';
import { renderHtml, wrapHtmlInMarkdown } from './renderers/index.ts';
import {
  isAirtable2HtmlScriptingOptions,
  resolveAirtableScriptingConfig,
} from './airtable-scripting-config.ts';
import type { Airtable2HtmlScriptingOptions } from './airtable-scripting-config.ts';
import type { Airtable2HtmlConfig } from './types.ts';

export function airtable2html(
  options: Airtable2HtmlScriptingOptions,
): Promise<string>;

export function airtable2html<
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
): Promise<string>;

export async function airtable2html(
  input:
    | Airtable2HtmlScriptingOptions
    | Airtable2HtmlConfig<unknown, unknown, unknown, unknown>,
): Promise<string> {
  const config = isAirtable2HtmlScriptingOptions(input)
    ? resolveAirtableScriptingConfig(input)
    : input;
  const model = await createAirtableTableModel(config);
  const isMarkdown = config.output?.format === 'markdown';

  let html = renderHtml(model, {
    ...config.html,
    ...(isMarkdown && config.html?.pretty === undefined
      ? { pretty: true }
      : {}),
  });

  for (const [index, callback] of (config.pipeline ?? []).entries()) {
    const transformed = await callback(html, {
      model,
      config,
      index,
    });

    if (typeof transformed !== 'string') {
      throw new TypeError(
        `HTML pipeline callback at index ${index} must return a string.`,
      );
    }

    html = transformed;
  }

  return isMarkdown
    ? wrapHtmlInMarkdown(html, config.markdown)
    : html;
}

export default airtable2html;
