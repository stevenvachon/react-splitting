import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatBy, renderToHTML, SINGLE_WORD_INPUT } from '../testHelpers';
import { Segmentation, splitting, Splitting } from './index';

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
  ([undefined, Segmentation.CHARS, Segmentation.WORDS] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls splitting()', () => {
        renderToHTML(<Splitting by={by} children={SINGLE_WORD_INPUT} />);
        expect(splitting).toHaveBeenCalledExactlyOnceWith(SINGLE_WORD_INPUT, { by });
      });
    })
  ));
