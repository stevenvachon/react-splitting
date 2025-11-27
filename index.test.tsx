import { describe, expect, it } from 'vitest';
import htmlnano from 'htmlnano';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SetOptional } from 'type-fest';
import splitting from 'splitting';
import Splitting, { CHARS, type SplittingProps, WORDS } from './index';

// TODO: add test for onClick within children, to see if it still works after splitting
// TODO: add test containing nested Components
// TODO: add test for empty children
// TODO: add test for data-* and style attributes being preserved on children
// TODO: add test for (multiple?) "	" (tab character) whitespace handling
// TODO: add edge case test (that is known to fail) for trailing whitespace

const render = async (props: SplittingProps) => ({
  /**
   * The result of the React component.
   */
  component: (() => {
    let charCount = 0;
    let wordCount = 0;
    const html = renderToStaticMarkup(
      <Splitting
        {...props}
        onCount={(w, c) => {
          charCount = c;
          wordCount = w;
        }}
      />
    );
    return { charCount, html, wordCount };
  })(),
  /**
   * The result of the original splitting.js library.
   */
  original: await (async () => {
    const div = document.createElement('div');
    div.innerHTML = renderToStaticMarkup(props.children);
    //console.debug('BEFORE ORIGINAL:', div.outerHTML);
    const [{ chars, words }] = splitting({
      by: props?.by,
      target: div,
      key: props?.cssKey,
      whitespace: props?.whitespace,
    });
    //console.debug('AFTER ORIGINAL (before normalization):', div.outerHTML);
    return {
      charCount: chars?.length ?? 0,
      html: (
        await htmlnano.process(div.innerHTML, {
          // @ts-expect-error -- I think this is okay
          collapseWhitespace: false,
          custom: [
            tree =>
              tree.walk(node => {
                if (node?.attrs) {
                  // Remove CSS classes if the component does not render them
                  if (
                    !props.cssClasses &&
                    Object.prototype.hasOwnProperty.call(node.attrs, 'class')
                  ) {
                    node.attrs.class = node.attrs.class
                      ?.split(/\s+/)
                      .filter(c => c !== 'char' && c !== 'whitespace' && c !== 'word')
                      .join(' ');
                  }
                  // Remove CSS variables if the component does not render them
                  if (
                    !props.cssVariables &&
                    Object.prototype.hasOwnProperty.call(node.attrs, 'style')
                  ) {
                    node.attrs.style = node.attrs.style?.replace(
                      props.cssKey
                        ? new RegExp(`--${props.cssKey}-(char|word)-index:\\s*\\d+`)
                        : /--(char|word)-index:\s*\d+/,
                      ''
                    );
                  }
                  // Remove data-* attributes if the component does not render them
                  if (!props.dataAttributes) {
                    ['data-char', 'data-word'].forEach(attrName => {
                      if (Object.prototype.hasOwnProperty.call(node.attrs, attrName)) {
                        delete (node.attrs as Record<string, string | undefined>)[attrName];
                      }
                    });
                  }
                }
                return node;
              }),
          ],
          minifyJs: false, // Suppress dependency warnings
        })
      ).html,
      wordCount: words?.length ?? 0,
    };
  })(),
});

const COMPLEX_CHILDREN = (
  <>
    <em className="persist">text1</em> <strong data-persist>text2</strong>
  </>
);
const SIMPLE_CHILDREN = <>text1 text2</>;

/**
 * Make--one or multiple--assertions that the React component produces the same results as the original splitting.js library.
 */
const test = async ({
  children = [SIMPLE_CHILDREN, COMPLEX_CHILDREN],
  ...props
}: SetOptional<SplittingProps, 'children'>) => {
  if (Array.isArray(children)) {
    for (const child of children) {
      const { component, original } = await render({ children: child, ...props });
      //console.debug({
      //  '<Splitting/>': component.html,
      //  'splitting.js': original.html,
      //});
      expect(component).toEqual(original);
    }
  } else {
    const { component, original } = await render({ children, ...props });
    //console.debug({
    //  '<Splitting/>': component.html,
    //  'splitting.js': original.html,
    //});
    expect(component).toEqual(original);
  }
};

describe('by', () => {
  describe(`"${CHARS}"`, () => {
    it('works', () => test({ by: CHARS }));

    it('supports cssClasses, cssVariables and dataAttributes', () =>
      test({
        by: CHARS,
        cssClasses: true,
        cssVariables: true,
        dataAttributes: true,
      }));

    it('is the default value', () => test({ children: SIMPLE_CHILDREN }));
  });

  describe(`"${WORDS}"`, () => {
    it('works', () => test({ by: WORDS }));

    it('supports cssClasses, cssVariables and dataAttributes', () =>
      test({
        by: WORDS,
        cssClasses: true,
        cssVariables: true,
        dataAttributes: true,
      }));
  });

  it('throws an error for invalid values', () =>
    ['non-existent', null, 0, [], {}].forEach(by =>
      // @ts-expect-error unsupported values
      expect(() => renderToStaticMarkup(<Splitting by={by}>text</Splitting>)).toThrow(TypeError)
    ));
});
