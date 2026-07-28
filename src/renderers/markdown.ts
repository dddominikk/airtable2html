import { renderHtml } from './html.ts';
import type {
  HtmlRenderOptions,
  MarkdownRenderOptions,
  TableModel,
} from '../types.ts';

export function renderMarkdown(
  model: TableModel,
  htmlOptions: HtmlRenderOptions = {},
  markdownOptions: MarkdownRenderOptions = {},
): string {
  const html = renderHtml(model, {
    ...htmlOptions,
    pretty: htmlOptions.pretty ?? true,
  });

  if (markdownOptions.fenced === false) return html;

  return `\`\`\`${markdownOptions.language ?? 'html'}\n${html}\n\`\`\``;
}
