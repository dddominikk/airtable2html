import type { CellTransform } from '../types.ts';

/**
 * Formats a textual inferred date for compact table output.
 *
 * A value such as `jul 28 2026` becomes `Jul 28`. Values that do not match
 * the full month/day/year shape are only capitalized.
 */
export const formatInferredDateAsMonthDay: CellTransform = (value) => {
  const text = String(value);
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);

  return /^\w+ \d+ \d+$/u.test(text)
    ? capitalized.replace(/ \d+$/u, '')
    : capitalized;
};

export default formatInferredDateAsMonthDay;
