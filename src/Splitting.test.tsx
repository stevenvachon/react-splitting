import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  byIsChars,
  formatBy,
  MULTIPLE_WORDS_CHILDREN,
  renderToHTML,
  SINGLE_WORD_CHILDREN,
} from './testHelpers';
import type { ContentCallback_Chars, ContentCallback_Words } from './types';
import { render as renderToDOM, screen } from '@testing-library/react';
import splitChildren from './splitChildren';
import Splitting, { CHARS, WORDS } from './Splitting';
import userEvent from '@testing-library/user-event';

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
        await renderToHTML(<Splitting by={by} children={SINGLE_WORD_CHILDREN} />);
        expect(splitChildren).toHaveBeenCalledExactlyOnceWith(SINGLE_WORD_CHILDREN, { by });
      });

      // TODO: test for charProps, wordProps?

      it('supports content prop', async () =>
        expect(
          await renderToHTML(
            <Splitting
              by={by}
              children={MULTIPLE_WORDS_CHILDREN}
              content={
                ((i, charOrWordOrWhitespace) => `${charOrWordOrWhitespace}_${i ?? '*'}`) as
                  | ContentCallback_Chars
                  | ContentCallback_Words
              }
            />
          )
        ).toBe(
          await renderToHTML(
            byIsChars(by) ? (
              <>
                <span>
                  <span>t_0</span>
                  <span>e_1</span>
                  <span>x_2</span>
                  <span>t_3</span>
                  <span>1_4</span>
                </span>
                <span> _*</span>
                <span>
                  <span>t_5</span>
                  <span>e_6</span>
                  <span>x_7</span>
                  <span>t_8</span>
                  <span>2_9</span>
                </span>
              </>
            ) : (
              <>
                <span>text1_0</span>
                <span> _*</span>
                <span>text2_1</span>
              </>
            )
          )
        ));

      if (byIsChars(by)) {
        it('supports content and whitespace props', async () => {
          const content = vi.fn();
          await renderToHTML(
            <Splitting by={by} children={MULTIPLE_WORDS_CHILDREN} content={content} whitespace />
          );
          content.mock.calls.forEach(call =>
            expect(call).toEqual([expect.any(Number), expect.any(String)])
          );
        });

        it('supports omitWordElements prop', async () =>
          expect(
            await renderToHTML(
              <Splitting by={by} children={MULTIPLE_WORDS_CHILDREN} omitWordElements />
            )
          ).toBe(
            await renderToHTML(
              <>
                <span>t</span>
                <span>e</span>
                <span>x</span>
                <span>t</span>
                <span>1</span>
                <span> </span>
                <span>t</span>
                <span>e</span>
                <span>x</span>
                <span>t</span>
                <span>2</span>
              </>
            )
          ));
      }

      it('supports omitWhitespaceElements prop', async () =>
        expect(
          await renderToHTML(
            <Splitting by={by} children={MULTIPLE_WORDS_CHILDREN} omitWhitespaceElements />
          )
        ).toBe(
          await renderToHTML(
            byIsChars(by) ? (
              <>
                <span>
                  <span>t</span>
                  <span>e</span>
                  <span>x</span>
                  <span>t</span>
                  <span>1</span>
                </span>{' '}
                <span>
                  <span>t</span>
                  <span>e</span>
                  <span>x</span>
                  <span>t</span>
                  <span>2</span>
                </span>
              </>
            ) : (
              <>
                <span>text1</span> <span>text2</span>
              </>
            )
          )
        ));

      it('supports onCharCount and onWordCount props (SSR)', async () => {
        const onCharCount = vi.fn();
        const onWordCount = vi.fn();
        await renderToHTML(
          <Splitting
            by={by}
            children={SINGLE_WORD_CHILDREN}
            onCharCount={onCharCount}
            onWordCount={onWordCount}
          />
        );
        if (byIsChars(by)) {
          expect(onCharCount).toHaveBeenCalledExactlyOnceWith(4);
        } else {
          expect(onCharCount).not.toHaveBeenCalled();
        }
        expect(onWordCount).toHaveBeenCalledExactlyOnceWith(1);
      });

      it('supports onCharCount and onWordCount props (DOM)', () => {
        const onCharCount1 = vi.fn();
        const onCharCount2 = vi.fn();
        const onWordCount1 = vi.fn();
        const onWordCount2 = vi.fn();
        const { rerender } = renderToDOM(
          <Splitting
            by={by}
            children={SINGLE_WORD_CHILDREN}
            onCharCount={onCharCount1}
            onWordCount={onWordCount1}
          />
        );
        if (byIsChars(by)) {
          expect(onCharCount1).toHaveBeenCalledExactlyOnceWith(4);
        } else {
          expect(onCharCount1).not.toHaveBeenCalled();
        }
        expect(onCharCount2).not.toHaveBeenCalled();
        expect(onWordCount1).toHaveBeenCalledExactlyOnceWith(1);
        expect(onWordCount2).not.toHaveBeenCalled();
        rerender(
          <Splitting
            by={by}
            children={SINGLE_WORD_CHILDREN}
            onCharCount={onCharCount2} // Changed
            onWordCount={onWordCount2} // Changed
          />
        );
        if (by === CHARS || by === undefined) {
          expect(onCharCount1).toHaveBeenCalledOnce();
          expect(onCharCount2).toHaveBeenCalledExactlyOnceWith(4);
        } else {
          expect(onCharCount1).not.toHaveBeenCalled();
          expect(onCharCount2).not.toHaveBeenCalled();
        }
        expect(onWordCount1).toHaveBeenCalledOnce();
        expect(onWordCount2).toHaveBeenCalledExactlyOnceWith(1);
      });

      it('preserves user events', async () => {
        const handleClick = vi.fn();
        renderToDOM(
          <Splitting by={by}>
            text1
            <div>
              <div>
                <button onClick={handleClick}>text2</button>
              </div>
            </div>
          </Splitting>
        );
        await userEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledOnce();
      });

      it('ignores <script> and <style> elements', async () => {
        const script = <script>window.alert("ok");</script>;
        const style = <style>{`html{--test:1;}`}</style>;
        expect(
          await renderToHTML(
            <Splitting by={by}>
              text {script} {style}
            </Splitting>
          )
        ).toBe(
          await renderToHTML(
            <>
              {byIsChars(by) ? (
                <span>
                  <span>t</span>
                  <span>e</span>
                  <span>x</span>
                  <span>t</span>
                </span>
              ) : (
                <span>text</span>
              )}
              <span> </span>
              {script}
              {style}
            </>
          )
        );
      });
    })
  );

  it('throws an error for invalid values', () =>
    Promise.all(
      ['non-existent', null, 0, [], {}].map(by =>
        expect(() =>
          // @ts-expect-error unsupported values
          renderToHTML(<Splitting by={by} children={SINGLE_WORD_CHILDREN} />)
        ).rejects.toThrow(TypeError)
      )
    ));
});
