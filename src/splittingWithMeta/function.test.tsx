import { assertParity, DEFAULT_TAG, formatBy, MULTIPLE_WORDS_INPUT } from '../testHelpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Segmentation, splittingWithMeta } from './index';
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
  ([undefined, Segmentation.CHARS, Segmentation.WORDS] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls split()', () => {
        splittingWithMeta(MULTIPLE_WORDS_INPUT, { as: DEFAULT_TAG, by });
        expect(split).toHaveBeenCalledExactlyOnceWith(
          MULTIPLE_WORDS_INPUT,
          expect.any(Object) // Defaulted params and excluded props makes this too messy to be exact
        );
      });

      it('merges className', () => {
        const { container } = splittingWithMeta(MULTIPLE_WORDS_INPUT, {
          as: DEFAULT_TAG,
          by,
          className: 'extra',
        });
        expect(container.props.className).toBe(
          by === Segmentation.WORDS ? 'splitting words extra' : 'chars splitting words extra'
        );
      });

      it('merges style', () => {
        const { container } = splittingWithMeta(MULTIPLE_WORDS_INPUT, {
          as: DEFAULT_TAG,
          by,
          style: { color: 'red' },
        });
        expect(container.props.style).toEqual({
          ...(by === Segmentation.WORDS ? {} : { '--char-total': 10 }),
          '--word-total': 2,
          color: 'red',
        });
      });

      it('merges DOM props', () => {
        const { container } = splittingWithMeta(MULTIPLE_WORDS_INPUT, {
          as: DEFAULT_TAG,
          by,
          'aria-label': 'split',
          // @ts-expect-error -- unknown data-* attrs
          'data-testid': 'root',
          id: 'main',
        });
        expect(container.props).toMatchObject({
          'aria-label': 'split',
          'data-testid': 'root',
          id: 'main',
        });
      });

      it('has parity with (original) splitting', async () => {
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
