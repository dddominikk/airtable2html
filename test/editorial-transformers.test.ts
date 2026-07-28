import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTransformRegistry,
  formatInferredDateAsMonthDay,
  formatMonthCountDuration,
  normalizeHowLongToBeatDuration,
  normalizeXboxGamePassPlatforms,
  resolveTransform,
  type CellTransformContext,
} from '../src/index.ts';

function createContext(options: unknown = undefined): CellTransformContext {
  return {
    rawValue: undefined,
    stringValue: '',
    field: {
      id: 'fld00000000000001',
      name: 'Value',
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

test('registers the transformer modules for declarative config references', async () => {
  const registry = createTransformRegistry();
  const resolved = resolveTransform(
    {
      name: 'duration.monthCount',
      options: { abbreviate: false },
    },
    registry,
  );

  assert.equal(typeof registry['date.inferredMonthDay'], 'function');
  assert.equal(typeof registry['xboxGamePass.platforms'], 'function');
  assert.equal(typeof registry['howLongToBeat.duration'], 'function');
  assert.equal(
    await resolved.transform('13', createContext(resolved.options)),
    '1 year, 1 month',
  );
});
