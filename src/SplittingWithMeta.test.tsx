import {
  assertParity,
  byIsChars,
  DEFAULT_TAG,
  formatBy,
  MULTIPLE_WORDS_CHILDREN,
  renderToHTML,
  SINGLE_WORD_CHILDREN,
} from './testHelpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortal } from 'react-dom';
import { render as renderToDOM } from '@testing-library/react';
import splitChildren from './splitChildren';
import SplittingWithMeta, { CHARS, WORDS } from './SplittingWithMeta';

// TODO: improve when possible: https://github.com/vitest-dev/vitest/discussions/9290
vi.mock('./splitChildren', async () => {
  const actual = await vi.importActual<typeof import('./splitChildren')>('./splitChildren');
  return {
    ...actual,
    default: vi.spyOn(actual, 'default'),
  };
});

beforeEach(() => vi.mocked(splitChildren).mockClear());

describe('by', () => {
  ([CHARS, WORDS, undefined] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('calls splitChildren()', async () => {
        await renderToHTML(
          <SplittingWithMeta as={DEFAULT_TAG} by={by} children={SINGLE_WORD_CHILDREN} />
        );
        expect(splitChildren).toHaveBeenCalledExactlyOnceWith(
          SINGLE_WORD_CHILDREN,
          expect.any(Object) // Defaulted params and excluded props makes this too messy to be exact
        );
      });

      it('supports many children types', async () => {
        await assertParity({ as: DEFAULT_TAG, by });
        await assertParity({
          as: DEFAULT_TAG,
          by,
          children: [[], <></>, 0, 1, true, false, null, undefined],
        });
        renderToDOM(
          <SplittingWithMeta as={DEFAULT_TAG} by={by}>
            {createPortal(<div>text</div>, document.body)}
          </SplittingWithMeta>
        );
      });

      it('supports cssKey and whitespace props', () =>
        // TODO: remove `children` override when possible: https://github.com/shshaw/Splitting/issues/76
        assertParity({
          as: DEFAULT_TAG,
          by,
          children: MULTIPLE_WORDS_CHILDREN,
          cssKey: 'custom',
          whitespace: true,
        }));

      it('supports onCharCount and onWordCount props (SSR)', async () => {
        const onCharCount = vi.fn();
        const onWordCount = vi.fn();
        await renderToHTML(
          <SplittingWithMeta
            as={DEFAULT_TAG}
            by={by}
            children={MULTIPLE_WORDS_CHILDREN}
            onCharCount={onCharCount}
            onWordCount={onWordCount}
          />
        );
        if (byIsChars(by)) {
          expect(onCharCount).toHaveBeenCalledExactlyOnceWith(10);
        } else {
          expect(onCharCount).not.toHaveBeenCalled();
        }
        expect(onWordCount).toHaveBeenCalledExactlyOnceWith(2);
      });

      it('supports onCharCount and onWordCount props (DOM)', () => {
        const onCharCount1 = vi.fn();
        const onCharCount2 = vi.fn();
        const onWordCount1 = vi.fn();
        const onWordCount2 = vi.fn();
        const { rerender } = renderToDOM(
          <SplittingWithMeta
            as={DEFAULT_TAG}
            by={by}
            children={MULTIPLE_WORDS_CHILDREN}
            onCharCount={onCharCount1}
            onWordCount={onWordCount1}
          />
        );
        if (byIsChars(by)) {
          expect(onCharCount1).toHaveBeenCalledExactlyOnceWith(10);
        } else {
          expect(onCharCount1).not.toHaveBeenCalled();
        }
        expect(onCharCount2).not.toHaveBeenCalled();
        expect(onWordCount1).toHaveBeenCalledExactlyOnceWith(2);
        expect(onWordCount2).not.toHaveBeenCalled();
        rerender(
          <SplittingWithMeta
            as={DEFAULT_TAG}
            by={by}
            children={MULTIPLE_WORDS_CHILDREN}
            onCharCount={onCharCount2} // Changed
            onWordCount={onWordCount2} // Changed
          />
        );
        if (byIsChars(by)) {
          expect(onCharCount1).toHaveBeenCalledOnce();
          expect(onCharCount2).toHaveBeenCalledExactlyOnceWith(10);
        } else {
          expect(onCharCount1).not.toHaveBeenCalled();
          expect(onCharCount2).not.toHaveBeenCalled();
        }
        expect(onWordCount1).toHaveBeenCalledOnce();
        expect(onWordCount2).toHaveBeenCalledExactlyOnceWith(2);
      });
    })
  );

  it('throws an error for invalid values', () =>
    Promise.all(
      ['non-existent', null, 0, [], {}].map(by =>
        expect(() =>
          renderToHTML(
            // @ts-expect-error unsupported values
            <SplittingWithMeta as={DEFAULT_TAG} by={by} children={SINGLE_WORD_CHILDREN} />
          )
        ).rejects.toThrow(TypeError)
      )
    ));
});
