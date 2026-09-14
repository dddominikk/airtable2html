import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTransformRegistry,
  formatInferredDateAsMonthDay,
  formatMonthCountDuration,
  formatScore,
  normalizeHowLongToBeatDuration,
  normalizeXboxGamePassPlatforms,
  resolveTransform,
  type CellTransformContext,
} from '../src/index.ts';

function createContext(
  options: unknown = undefined,
  fieldOptions: unknown = undefined,
): CellTransformContext {
  return {
    rawValue: undefined,
    stringValue: '',
    field: {
      id: 'fld00000000000001',
      name: 'Value',
      ...(fieldOptions !== undefined ? { options: fieldOptions } : {}),
      handle: {},
    },
    record: {},
    recordId: 'rec00000000000001',
    rowIndex: 0,
    columnIndex: 0,
    options,
  };
}

test('formats inferred dates as compact month and day values', async () => {
  assert.equal(
    await formatInferredDateAsMonthDay('jul 28 2026', createContext()),
    'Jul 28',
  );
  assert.equal(
    await formatInferredDateAsMonthDay('summer 2026', createContext()),
    'Summer 2026',
  );
});

test('normalizes Xbox Game Pass platform labels with a legacy compatibility option', async () => {
  assert.equal(
    await normalizeXboxGamePassPlatforms(
      'Xbox One, Series X/S, Cloud, PC',
      createContext(),
    ),
    'Cloud, Console, PC',
  );
  assert.equal(
    await normalizeXboxGamePassPlatforms('Xbox One', createContext()),
    'Series X/S',
  );
  assert.equal(
    await normalizeXboxGamePassPlatforms(
      'Xbox One',
      createContext({ preserveLegacyXboxOneOnlyMapping: false }),
    ),
    'Xbox One',
  );
});

test('normalizes HowLongToBeat ranges and empty values', async () => {
  assert.equal(
    await normalizeHowLongToBeatDuration('10 - 14 hours', createContext()),
    '10–14 hours',
  );
  assert.equal(
    await normalizeHowLongToBeatDuration('', createContext()),
    'N/A',
  );
});

test('formats month counts using typed transform options', async () => {
  assert.equal(
    await formatMonthCountDuration('26', createContext()),
    '2y, 2m',
  );
  assert.equal(
    await formatMonthCountDuration(
      '26',
      createContext({ abbreviate: false, separator: ' and ' }),
    ),
    '2 years and 2 months',
  );
  assert.equal(
    await formatMonthCountDuration('', createContext()),
    '',
  );
});

test('formats score values with Airtable field precision and validation options', async () => {
  assert.equal(
    await formatScore('89.46', createContext(undefined, { precision: 1 })),
    '89.5',
  );
  assert.equal(
    await formatScore(89.46, createContext({ precision: 2 }, { precision: 0 })),
    '89.46',
  );
  assert.equal(await formatScore('-1', createContext()), 'N/A');
  assert.equal(
    await formatScore('-1.25', createContext({ allowNegative: true, precision: 1 })),
    '-1.3',
  );
  assert.equal(await formatScore('', createContext()), 'N/A');
  assert.equal(
    await formatScore('not a score', createContext({ default: '—' })),
    '—',
  );
  assert.equal(
    await formatScore('101', createContext({ min: 0, max: 100, default: 'N/A' })),
    'N/A',
  );
});

test('registers the transformer modules for declarative config references', async () => {
  const registry = createTransformRegistry();
  const resolved = resolveTransform(
    {
      name: 'duration.monthCount',
      options: { abbreviate: false },
    },
    registry,
  );
  const scoreResolved = resolveTransform(
    {
      name: 'rating.openCritic',
      options: { min: 0, max: 100, default: 'N/A' },
    },
    registry,
  );

  assert.equal(typeof registry['date.inferredMonthDay'], 'function');
  assert.equal(typeof registry['xboxGamePass.platforms'], 'function');
  assert.equal(typeof registry['howLongToBeat.duration'], 'function');
  assert.equal(typeof registry['number.score'], 'function');
  assert.equal(registry['rating.openCritic'], registry['number.score']);
  assert.equal(
    await resolved.transform('13', createContext(resolved.options)),
    '1 year, 1 month',
  );
  assert.equal(
    await scoreResolved.transform(
      '91.4',
      createContext(scoreResolved.options, { precision: 0 }),
    ),
    '91',
  );
});
