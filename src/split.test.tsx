import '@testing-library/jest-dom';
import { byIsChars, formatBy, MULTIPLE_WORDS_INPUT, renderToHTML } from './testHelpers';
import type { CharPropsCallback, ContentCallback, WordPropsCallback } from './types';
import { CHARS, COLLAPSED_WHITESPACE, WORDS } from './constants';
import { createPortal } from 'react-dom';
import { describe, expect, it, vi } from 'vitest';
import { type ReactNode } from 'react';
import { render as renderToDOM, screen } from '@testing-library/react';
import split, { type SplitProps } from './split';
import userEvent from '@testing-library/user-event';

const MULTIPLE_WORDS_RESULT_CHARS = (
  <>
    <span>
      <span>t</span>
      <span>e</span>
      <span>x</span>
      <span>t</span>
      <span>1</span>
    </span>
    <span>{COLLAPSED_WHITESPACE}</span>
    <span>
      <span>t</span>
      <span>e</span>
      <span>x</span>
      <span>t</span>
      <span>2</span>
    </span>
  </>
);

const MULTIPLE_WORDS_RESULT_WORDS = (
  <>
    <span>text1</span>
    <span>{COLLAPSED_WHITESPACE}</span>
    <span>text2</span>
  </>
);

/**
 * Test the rendered result. **The counts are ignored.**
 * @example
 * test({ by: CHARS }, <>result</>);
 * test(<>input</>, { by: CHARS }, <>result</>);
 */
const test: {
  (props: SplitProps, expectedSegments: ReactNode): void;
  (input: ReactNode, props: SplitProps, expectedSegments: ReactNode): void;
} = (arg1: ReactNode | SplitProps, arg2: ReactNode | SplitProps, arg3?: ReactNode) => {
  const [input, props, expectedSegments] =
    arg3 === undefined
      ? [MULTIPLE_WORDS_INPUT, arg1 as SplitProps, arg2 as ReactNode]
      : [arg1 as ReactNode, arg2 as SplitProps, arg3];
  const { segments } = split(input, props);
  const expectedHTML = renderToHTML(expectedSegments);
  expect(renderToDOM(segments).container).toContainHTML(expectedHTML);
  expect(renderToHTML(segments)).toBe(expectedHTML);
};

describe('by', () => {
  ([CHARS, WORDS, undefined] as any[]).forEach(by =>
    describe(formatBy(by), () => {
      it('supports many types for input prop', () =>
        [
          [],
          <></>,
          0,
          1,
          true,
          false,
          null,
          undefined,
          createPortal(<div data-testid="portal">text</div>, document.body),
        ].forEach(input => expect(() => split(input, { by })).not.toThrowError()));

      it('preserves user events', async () => {
        const handleClick = vi.fn();
        renderToDOM(
          split(
            <>
              text1
              <div>
                <div>
                  <button onClick={handleClick}>text2</button>
                </div>
              </div>
            </>,
            { by }
          ).segments
        );
        await userEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledOnce();
      });

      it('ignores <script> and <style> elements', () => {
        const script = <script>window.alert("ok");</script>;
        const style = <style>{`html{--test:1;}`}</style>;
        test(
          <>
            text{COLLAPSED_WHITESPACE}
            {script}
            {COLLAPSED_WHITESPACE}
            {style}
          </>,
          { by },
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
            <span>{COLLAPSED_WHITESPACE}</span>
            {script}
            <span>{COLLAPSED_WHITESPACE}</span>
            {style}
          </>
        );
      });
    })
  );

  it('throws an error for invalid values', () =>
    ['non-existent', null, 0, [], {}].map(by =>
      expect(
        () =>
          // @ts-expect-error unsupported values
          split(MULTIPLE_WORDS_INPUT, { by }).result
      ).toThrow(TypeError)
    ));
});

describe('charProps', () => {
  it('works', () => {
    const charProps: CharPropsCallback = (i, char) =>
      // @ts-expect-error -- TypeScript may never support data-* attrs
      ({
        'data-char': char,
        'data-char-index': char === COLLAPSED_WHITESPACE ? undefined : i,
      });

    test(
      { by: CHARS, charProps },
      <>
        <span>
          <span data-char="t" data-char-index="0">
            t
          </span>
          <span data-char="e" data-char-index="1">
            e
          </span>
          <span data-char="x" data-char-index="2">
            x
          </span>
          <span data-char="t" data-char-index="3">
            t
          </span>
          <span data-char="1" data-char-index="4">
            1
          </span>
        </span>
        <span data-char={COLLAPSED_WHITESPACE}>{COLLAPSED_WHITESPACE}</span>
        <span>
          <span data-char="t" data-char-index="5">
            t
          </span>
          <span data-char="e" data-char-index="6">
            e
          </span>
          <span data-char="x" data-char-index="7">
            x
          </span>
          <span data-char="t" data-char-index="8">
            t
          </span>
          <span data-char="2" data-char-index="9">
            2
          </span>
        </span>
      </>
    );

    test(
      { by: WORDS, charProps },
      <>
        <span>text1</span>
        <span data-char={COLLAPSED_WHITESPACE}>{COLLAPSED_WHITESPACE}</span>
        <span>text2</span>
      </>
    );
  });

  it('supports an undefined return value', () => {
    const charProps = () => undefined;
    test({ by: CHARS, charProps }, MULTIPLE_WORDS_RESULT_CHARS);
    test({ by: WORDS, charProps }, MULTIPLE_WORDS_RESULT_WORDS);
  });
});

describe('content', () => {
  it('works', () => {
    const content = ((i, charOrWordOrWhitespace) =>
      `${charOrWordOrWhitespace}_${i ?? '*'}`) as ContentCallback;

    test(
      { by: CHARS, content },
      <>
        <span>
          <span>t_0</span>
          <span>e_1</span>
          <span>x_2</span>
          <span>t_3</span>
          <span>1_4</span>
        </span>
        <span>{COLLAPSED_WHITESPACE}_*</span>
        <span>
          <span>t_5</span>
          <span>e_6</span>
          <span>x_7</span>
          <span>t_8</span>
          <span>2_9</span>
        </span>
      </>
    );

    test(
      { by: WORDS, content },
      <>
        <span>text1_0</span>
        <span>{COLLAPSED_WHITESPACE}_*</span>
        <span>text2_1</span>
      </>
    );
  });

  it('supports an undefined return value', () => {
    test(
      { by: CHARS, content: () => undefined },
      <>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span></span>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </>
    );

    test(
      { by: WORDS, content: () => undefined },
      <>
        <span></span>
        <span></span>
        <span></span>
      </>
    );
  });

  it('supports whitespace prop', () => {
    const content = vi.fn();
    split(MULTIPLE_WORDS_INPUT, { by: CHARS, content, whitespace: true });
    content.mock.calls.forEach(call =>
      expect(call).toEqual([expect.any(Number), expect.any(String)])
    );
  });
});

describe('omitWhitespaceElements', () => {
  it('works', () => {
    test(
      { by: CHARS, omitWhitespaceElements: true },
      <>
        <span>
          <span>t</span>
          <span>e</span>
          <span>x</span>
          <span>t</span>
          <span>1</span>
        </span>
        {COLLAPSED_WHITESPACE}
        <span>
          <span>t</span>
          <span>e</span>
          <span>x</span>
          <span>t</span>
          <span>2</span>
        </span>
      </>
    );

    test(
      { by: WORDS, omitWhitespaceElements: true },
      <>
        <span>text1</span>
        {COLLAPSED_WHITESPACE}
        <span>text2</span>
      </>
    );
  });
});

describe('omitWordElements', () => {
  it('works', () =>
    test(
      { by: CHARS, omitWordElements: true },
      <>
        <span>t</span>
        <span>e</span>
        <span>x</span>
        <span>t</span>
        <span>1</span>
        <span>{COLLAPSED_WHITESPACE}</span>
        <span>t</span>
        <span>e</span>
        <span>x</span>
        <span>t</span>
        <span>2</span>
      </>
    ));
});

describe('wordProps', () => {
  it('works', () => {
    const wordProps: WordPropsCallback = (i, word) =>
      // @ts-expect-error -- TypeScript may never support data-* attrs
      ({
        'data-word': word,
        'data-word-index': i,
      });

    test(
      { by: CHARS, wordProps },
      <>
        <span data-word="text1" data-word-index="0">
          <span>t</span>
          <span>e</span>
          <span>x</span>
          <span>t</span>
          <span>1</span>
        </span>
        <span>{COLLAPSED_WHITESPACE}</span>
        <span data-word="text2" data-word-index="1">
          <span>t</span>
          <span>e</span>
          <span>x</span>
          <span>t</span>
          <span>2</span>
        </span>
      </>
    );

    test(
      { by: WORDS, wordProps },
      <>
        <span data-word="text1" data-word-index="0">
          text1
        </span>
        <span>{COLLAPSED_WHITESPACE}</span>
        <span data-word="text2" data-word-index="1">
          text2
        </span>
      </>
    );
  });

  it('supports an undefined return value', () => {
    const wordProps = () => undefined;
    test({ by: CHARS, wordProps }, MULTIPLE_WORDS_RESULT_CHARS);
    test({ by: WORDS, wordProps }, MULTIPLE_WORDS_RESULT_WORDS);
  });
});
