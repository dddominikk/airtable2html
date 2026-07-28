import type { CellTransform } from '../types.ts';

export interface FormatMonthCountDurationOptions {
  /** Uses `1y, 2m` labels instead of `1 year, 2 months`. Defaults to true. */
  abbreviate?: boolean;
  /** Joins year and month parts with this separator. Defaults to `, `. */
  separator?: string;
  /** Value returned for an empty Airtable cell. Defaults to an empty string. */
  emptyValue?: string;
}

/** Converts a total month count into a human-readable years-and-months duration. */
export const formatMonthCountDuration: CellTransform = (value, context) => {
  const options = (context.options ?? {}) as FormatMonthCountDurationOptions;
  const text = value === null || value === undefined ? '' : String(value).trim();

  if (text === '') return options.emptyValue ?? '';

  const totalMonths = Number.parseInt(text, 10);

  if (!Number.isFinite(totalMonths) || totalMonths < 0) {
    throw new TypeError(
      'formatMonthCountDuration requires a non-negative number or stringified number.',
    );
  }

  const abbreviate = options.abbreviate ?? true;
  const separator = options.separator ?? ', ';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];

  const formatPart = (
    amount: number,
    shortLabel: string,
    singularLabel: string,
    pluralLabel: string,
  ): string =>
    abbreviate
      ? `${amount}${shortLabel}`
      : `${amount} ${amount === 1 ? singularLabel : pluralLabel}`;

  if (years > 0) {
    parts.push(formatPart(years, 'y', 'year', 'years'));
  }

  if (months > 0 || parts.length === 0) {
    parts.push(formatPart(months, 'm', 'month', 'months'));
  }

  return parts.join(separator);
};

export default formatMonthCountDuration;
