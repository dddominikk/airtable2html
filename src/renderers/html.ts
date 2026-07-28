import type {
  HtmlAttributes,
  HtmlRenderOptions,
  TableModel,
} from '../types.ts';

export const defaultHtmlOptions = Object.freeze({
  pretty: false,
  escape: true,
  indent: '\t',
});

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderAttributes(attributes: HtmlAttributes | undefined): string {
  if (!attributes) return '';

  const rendered = Object.entries(attributes)
    .flatMap(([name, value]) => {
      if (value === null || value === undefined || value === false) return [];
      if (value === true) return [name];
      return [`${name}="${escapeHtml(String(value))}"`];
    })
    .join(' ');

  return rendered ? ` ${rendered}` : '';
}

export function renderHtml(
  model: TableModel,
  options: HtmlRenderOptions = {},
): string {
  const pretty = options.pretty ?? defaultHtmlOptions.pretty;
  const shouldEscape = options.escape ?? defaultHtmlOptions.escape;
  const indent = options.indent ?? defaultHtmlOptions.indent;
  const newline = pretty ? '\n' : '';
  const level = (depth: number) => (pretty ? indent.repeat(depth) : '');
  const cellText = (value: string) =>
    shouldEscape ? escapeHtml(value) : value;

  const headerCells = model.columns
    .map(
      (column) =>
        `${level(3)}<th${renderAttributes(options.headerCellAttributes)}>${column.header}</th>`,
    )
    .join(newline);

  const rows = model.rows
    .map((row) => {
      const cells = row.cells
        .map(
          (cell) =>
            `${level(3)}<td${renderAttributes(options.cellAttributes)}>${cellText(cell.text)}</td>`,
        )
        .join(newline);

      return [
        `${level(2)}<tr${renderAttributes(options.rowAttributes)}>`,
        cells,
        `${level(2)}</tr>`,
      ].join(newline);
    })
    .join(newline);

  return [
    `<table${renderAttributes(options.tableAttributes)}>`,
    `${level(1)}<thead${renderAttributes(options.theadAttributes)}>`,
    `${level(2)}<tr${renderAttributes(options.rowAttributes)}>`,
    headerCells,
    `${level(2)}</tr>`,
    `${level(1)}</thead>`,
    `${level(1)}<tbody${renderAttributes(options.tbodyAttributes)}>`,
    rows,
    `${level(1)}</tbody>`,
    '</table>',
  ].join(newline);
}
