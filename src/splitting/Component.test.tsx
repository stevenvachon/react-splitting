import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHARS, splitting, Splitting, WORDS } from './index';
import { formatBy, renderToHTML, SINGLE_WORD_INPUT } from '../testHelpers';

// TODO: improve when possible: https://github.com/vitest-dev/vitest/discussions/9290
vi.mock('./function', async () => {
  const actual = await vi.importActual<typeof import('./function')>('./function');
  return {
    ...actual,
    default: vi.spyOn(actual, 'default'),
  };
});

beforeEach(() => vi.mocked(splitting).mockClear());

describe('by', () =>
  ([CHARS, WORDS, undefined] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls splitting()', () => {
        renderToHTML(<Splitting by={by} children={SINGLE_WORD_INPUT} />);
        expect(splitting).toHaveBeenCalledExactlyOnceWith(SINGLE_WORD_INPUT, { by });
      });
    })
  ));
