import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatBy, SINGLE_WORD_INPUT } from '../testHelpers';
import { type ReactNode } from 'react';
import { Segmentation, splitting, type SplittingFunctionProps } from './index';
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

describe('by', () =>
  ([undefined, Segmentation.CHARS, Segmentation.WORDS] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls split()', () => {
        const args: [ReactNode, SplittingFunctionProps] = [SINGLE_WORD_INPUT, { by }];
        splitting(...args);
        expect(split).toHaveBeenCalledExactlyOnceWith(...args);
      });
    })
  ));
