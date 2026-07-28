import { formatInferredDateAsMonthDay } from './format-inferred-date.ts';
import { formatMonthCountDuration } from './format-month-count-duration.ts';
import { normalizeHowLongToBeatDuration } from './normalize-how-long-to-beat-duration.ts';
import { normalizeXboxGamePassPlatforms } from './normalize-xbox-game-pass-platforms.ts';
import type {
  CellTransform,
  CellTransformContext,
  TransformReference,
} from '../types.ts';

export { formatInferredDateAsMonthDay } from './format-inferred-date.ts';
export { formatMonthCountDuration } from './format-month-count-duration.ts';
export { normalizeHowLongToBeatDuration } from './normalize-how-long-to-beat-duration.ts';
export { normalizeXboxGamePassPlatforms } from './normalize-xbox-game-pass-platforms.ts';
export type { FormatMonthCountDurationOptions } from './format-month-count-duration.ts';
export type { NormalizeHowLongToBeatDurationOptions } from './normalize-how-long-to-beat-duration.ts';
export type { NormalizeXboxGamePassPlatformsOptions } from './normalize-xbox-game-pass-platforms.ts';

export interface FallbackTransformOptions {
  value?: unknown;
  trim?: boolean;
}

export interface RegexReplaceTransformOptions {
  pattern: string;
  replacement?: string;
  flags?: string;
}

export interface JoinTransformOptions {
  separator?: string;
}

export const identity: CellTransform = (value) => value;

export const fallback: CellTransform = (value, context) => {
  const options = (context.options ?? {}) as FallbackTransformOptions;
  const candidate = options.trim && typeof value === 'string' ? value.trim() : value;

  return candidate === null || candidate === undefined || candidate === ''
    ? (options.value ?? '')
    : candidate;
};

export const regexReplace: CellTransform = (value, context) => {
  const options = context.options as RegexReplaceTransformOptions;

  if (!options || typeof options.pattern !== 'string') {
    throw new TypeError(
      'The regexReplace transform requires a string options.pattern.',
    );
  }

  const expression = new RegExp(options.pattern, options.flags);
  return String(value ?? '').replace(expression, options.replacement ?? '');
};

export const join: CellTransform = (value, context) => {
  const options = (context.options ?? {}) as JoinTransformOptions;
  const separator = options.separator ?? ', ';

  return Array.isArray(value) ? value.join(separator) : value;
};

export const trim: CellTransform = (value) =>
  typeof value === 'string' ? value.trim() : value;

export const builtInTransforms: Readonly<Record<string, CellTransform>> = {
  identity,
  fallback,
  regexReplace,
  join,
  trim,
  'date.inferredMonthDay': formatInferredDateAsMonthDay,
  'duration.monthCount': formatMonthCountDuration,
  'howLongToBeat.duration': normalizeHowLongToBeatDuration,
  'xboxGamePass.platforms': normalizeXboxGamePassPlatforms,
};

export function createTransformRegistry<RecordHandle = unknown>(
  transforms: Readonly<Record<string, CellTransform<RecordHandle>>> = {},
): Readonly<Record<string, CellTransform<RecordHandle>>> {
  return {
    ...(builtInTransforms as Readonly<Record<string, CellTransform<RecordHandle>>>),
    ...transforms,
  };
}

export function resolveTransform<RecordHandle>(
  reference: TransformReference<RecordHandle> | undefined,
  registry: Readonly<Record<string, CellTransform<RecordHandle>>>,
): {
  transform: CellTransform<RecordHandle>;
  options: unknown;
} {
  if (!reference) {
    return {
      transform: registry.identity ?? (identity as CellTransform<RecordHandle>),
      options: undefined,
    };
  }

  if (typeof reference === 'function') {
    return { transform: reference, options: undefined };
  }

  const name = typeof reference === 'string' ? reference : reference.name;
  const transform = registry[name];

  if (!transform) {
    throw new ReferenceError(
      `Unknown transform ${JSON.stringify(name)}. Available transforms: ` +
        Object.keys(registry).sort().join(', '),
    );
  }

  return {
    transform,
    options: typeof reference === 'string' ? undefined : reference.options,
  };
}

export function createTransformContext<RecordHandle>(
  context: CellTransformContext<RecordHandle>,
): CellTransformContext<RecordHandle> {
  return context;
}
