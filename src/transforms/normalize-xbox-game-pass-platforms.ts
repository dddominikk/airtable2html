import type { CellTransform } from '../types.ts';

export interface NormalizeXboxGamePassPlatformsOptions {
  /**
   * Preserves the original mapping where an Xbox One-only value becomes
   * `Series X/S`. Defaults to true for compatibility with the existing script.
   */
  preserveLegacyXboxOneOnlyMapping?: boolean;
  /** Sorts the normalized platform labels alphabetically. Defaults to true. */
  sort?: boolean;
  /** Joins normalized labels with this separator. Defaults to `, `. */
  separator?: string;
}

const SECONDARY_PLATFORMS = ['Cloud', 'Handheld', 'PC'] as const;

/** Normalizes Airtable's Xbox Game Pass platform list for editorial tables. */
export const normalizeXboxGamePassPlatforms: CellTransform = (value, context) => {
  const options = (context.options ?? {}) as NormalizeXboxGamePassPlatformsOptions;
  const preserveLegacyXboxOneOnlyMapping =
    options.preserveLegacyXboxOneOnlyMapping ?? true;
  const platforms = String(value).split(/,\s*/u);
  const normalized: string[] = [];

  if (platforms.includes('Xbox One')) {
    if (platforms.includes('Series X/S')) {
      normalized.push('Console');
    } else {
      normalized.push(
        preserveLegacyXboxOneOnlyMapping ? 'Series X/S' : 'Xbox One',
      );
    }
  } else if (platforms.includes('Series X/S')) {
    normalized.push('Series X/S');
  }

  for (const platform of SECONDARY_PLATFORMS) {
    if (platforms.includes(platform)) normalized.push(platform);
  }

  const output = options.sort === false ? normalized : [...normalized].sort();
  return output.join(options.separator ?? ', ');
};

export default normalizeXboxGamePassPlatforms;
