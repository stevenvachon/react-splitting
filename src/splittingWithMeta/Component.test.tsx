import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TAG, formatBy, renderToHTML, SINGLE_WORD_INPUT } from '../testHelpers';

// Ugh
let CHARS: typeof import('./index').CHARS;
let WORDS: typeof import('./index').WORDS;
let SplittingWithMeta: typeof import('./index').SplittingWithMeta;
let splittingWithMeta: typeof import('./function').default;

beforeEach(async () => {
  // It's really strange that this was necessary
  vi.resetModules();
  const functionModule = await import('./function');
  // TODO: improve when possible: https://github.com/vitest-dev/vitest/discussions/9290
  vi.spyOn(functionModule, 'default');
  ({ default: splittingWithMeta } = functionModule);
  ({ CHARS, WORDS, SplittingWithMeta } = await import('./index'));
  vi.mocked(splittingWithMeta).mockClear();
});

describe('by', () => {
  ([CHARS, WORDS, undefined] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls splittingWithMeta()', () => {
        renderToHTML(<SplittingWithMeta as={DEFAULT_TAG} by={by} children={SINGLE_WORD_INPUT} />);
        expect(splittingWithMeta).toHaveBeenCalledExactlyOnceWith(
          SINGLE_WORD_INPUT,
          // Defaulted params and excluded props makes this too messy to be exact
          expect.objectContaining({ as: DEFAULT_TAG })
        );
      });
    })
  );
});
