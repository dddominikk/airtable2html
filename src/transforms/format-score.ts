import type { CellTransform, CellTransformContext } from '../types.ts';

export interface FormatScoreOptions {
  /** Decimal places to render. Defaults to the resolved Airtable field precision. */
  precision?: number;
  /** Whether negative scores are considered valid. Defaults to false. */
  allowNegative?: boolean;
  /** Optional inclusive minimum accepted score. */
  min?: number;
  /** Optional inclusive maximum accepted score. */
  max?: number;
  /** Value returned for empty, invalid, or rejected scores. Defaults to `N/A`. */
  default?: unknown;
}

const DEFAULT_SCORE_VALUE = 'N/A';

function parseScore(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (text === '') return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function validatePrecision(precision: unknown): number {
  if (
    typeof precision !== 'number' ||
    !Number.isInteger(precision) ||
    precision < 0 ||
    precision > 100
  ) {
    throw new RangeError('formatScore precision must be an integer from 0 to 100.');
  }

  return precision;
}

function getFieldPrecision(context: CellTransformContext): number | undefined {
  const fieldOptions = context.field.options;

  if (
    typeof fieldOptions !== 'object' ||
    fieldOptions === null ||
    !('precision' in fieldOptions)
  ) {
    return undefined;
  }

  const precision = (fieldOptions as { precision?: unknown }).precision;

  if (
    typeof precision !== 'number' ||
    !Number.isInteger(precision) ||
    precision < 0 ||
    precision > 100
  ) {
    return undefined;
  }

  return precision;
}

function validateBound(name: 'min' | 'max', value: unknown): number | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`formatScore ${name} must be a finite number.`);
  }

  return value;
}

/** Formats a numeric score while rejecting empty, invalid, or disallowed values. */
export const formatScore: CellTransform = (value, context) => {
  const options = (context.options ?? {}) as FormatScoreOptions;
  const fallback = options.default === undefined
    ? DEFAULT_SCORE_VALUE
    : options.default;
  const score = parseScore(value);

  if (score === null) return fallback;

  if (
    options.allowNegative !== undefined &&
    typeof options.allowNegative !== 'boolean'
  ) {
    throw new TypeError('formatScore allowNegative must be a boolean.');
  }

  if (!(options.allowNegative ?? false) && score < 0) return fallback;

  const min = validateBound('min', options.min);
  const max = validateBound('max', options.max);

  if (min !== undefined && max !== undefined && min > max) {
    throw new RangeError('formatScore min cannot be greater than max.');
  }

  if (min !== undefined && score < min) return fallback;
  if (max !== undefined && score > max) return fallback;

  const precision = options.precision === undefined
    ? getFieldPrecision(context)
    : validatePrecision(options.precision);

  return precision === undefined ? String(score) : score.toFixed(precision);
};

export default formatScore;
