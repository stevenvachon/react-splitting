import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup as render } from 'react-dom/server';
import Splitting, { CHARS, WORDS } from './index';

describe('by', () => {
  describe(`"${CHARS}"`, () => {
    it('works', () =>
      expect(render(<Splitting by={CHARS}>text</Splitting>)).toBe(
        render(
          <>
            <span>t</span>
            <span>e</span>
            <span>x</span>
            <span>t</span>
          </>
        )
      ));

    it('supports cssClasses, cssVariables and dataAttributes', () =>
      expect(
        render(
          <Splitting by={CHARS} cssClasses cssVariables dataAttributes>
            text
          </Splitting>
        )
      ).toBe(
        render(
          <>
            {/* @ts-expect-error */}
            <span className="char" data-char="t" style={{ '--char-index': 0 }}>
              t
            </span>
            {/* @ts-expect-error */}
            <span className="char" data-char="e" style={{ '--char-index': 1 }}>
              e
            </span>
            {/* @ts-expect-error */}
            <span className="char" data-char="x" style={{ '--char-index': 2 }}>
              x
            </span>
            {/* @ts-expect-error */}
            <span className="char" data-char="t" style={{ '--char-index': 3 }}>
              t
            </span>
          </>
        )
      ));

    it('is the default value', () =>
      expect(render(<Splitting>text</Splitting>)).toBe(
        render(
          <>
            <span>t</span>
            <span>e</span>
            <span>x</span>
            <span>t</span>
          </>
        )
      ));
  });

  describe(`"${WORDS}"`, () => {
    it('works', () =>
      expect(render(<Splitting by={WORDS}>text1 text2</Splitting>)).toBe(
        render(
          <>
            <span>text1</span>
            <span>text2</span>
          </>
        )
      ));

    it('supports cssClasses, cssVariables and dataAttributes ', () =>
      expect(
        render(
          <Splitting by={WORDS} cssClasses cssVariables dataAttributes>
            text1 text2
          </Splitting>
        )
      ).toBe(
        render(
          <>
            {/* @ts-expect-error */}
            <span className="word" data-word="text1" style={{ '--word-index': 0 }}>
              text1
            </span>
            {/* @ts-expect-error */}
            <span className="word" data-word="text2" style={{ '--word-index': 1 }}>
              text2
            </span>
          </>
        )
      ));
  });

  it('throws an error for invalid values', () =>
    ['non-existent', null, 0, [], {}].forEach(by =>
      // @ts-expect-error unsupported values
      expect(() => render(<Splitting by={by}>text</Splitting>)).toThrow(TypeError)
    ));
});
