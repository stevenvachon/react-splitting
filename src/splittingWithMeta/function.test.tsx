import { assertParity, DEFAULT_TAG, formatBy, MULTIPLE_WORDS_INPUT } from '../testHelpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHARS, splittingWithMeta, WORDS } from './index';
import split from '../split';

// TODO: improve when possible: https://github.com/vitest-dev/vitest/discussions/9290
vi.mock('../split', async () => {
  const actual = await vi.importActual<typeof import('../split')>('../split');
  return {
    ...actual,
    default: vi.spyOn(actual, 'default'),
  };
});

beforeEach(() => vi.mocked(split).mockClear());

describe('by', () => {
  ([CHARS, WORDS, undefined] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls split()', () => {
        splittingWithMeta(MULTIPLE_WORDS_INPUT, { as: DEFAULT_TAG, by });
        expect(split).toHaveBeenCalledExactlyOnceWith(
          MULTIPLE_WORDS_INPUT,
          expect.any(Object) // Defaulted params and excluded props makes this too messy to be exact
        );
      });

      it('has parity with splitting.js', async () => {
        await assertParity({ as: DEFAULT_TAG, by });

        // TODO: remove `input` override when possible: https://github.com/shshaw/Splitting/issues/76
        await assertParity({
          as: DEFAULT_TAG,
          by,
          cssKey: 'custom',
          input: MULTIPLE_WORDS_INPUT,
          whitespace: true,
        });
      });
    })
  );
});
