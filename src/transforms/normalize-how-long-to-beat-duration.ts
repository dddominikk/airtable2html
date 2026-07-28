import type { CellTransform } from '../types.ts';

export interface NormalizeHowLongToBeatDurationOptions {
  /** Value returned for an empty input. Defaults to `N/A`. */
  emptyValue?: string;
  /** Unit appended to normalized ranges. Defaults to `hours`. */
  unit?: string;
}

const DURATION_RANGE_PATTERN =
  /^(\d+(?:\.\d+)?)\s*[\-–—]\s*(\d+(?:\.\d+)?)(?:\s+hours\s*)?$/iu;

/**
 * Normalizes HowLongToBeat-style numeric ranges.
 *
 * For example, `10 - 14` and `10—14 hours` both become `10–14 hours`.
 */
export const normalizeHowLongToBeatDuration: CellTransform = (value, context) => {
  const options = (context.options ?? {}) as NormalizeHowLongToBeatDurationOptions;
  const emptyValue = options.emptyValue ?? 'N/A';
  const unit = options.unit ?? 'hours';
  const text = value ? String(value).trim() : emptyValue;

  return text.replace(
    DURATION_RANGE_PATTERN,
    (_match, minimum: string, maximum: string) =>
      `${minimum}–${maximum} ${unit}`,
  );
};

export default normalizeHowLongToBeatDuration;
