import { describe, expect, it, vi } from 'vitest';
import { createElement, type JSX } from 'react';
import { createPortal } from 'react-dom';
import htmlnano from 'htmlnano';
import { render as renderReactToDOM, screen } from '@testing-library/react';
import { renderToStaticMarkup as renderReactToHTML } from 'react-dom/server';
import splitting from 'splitting';
import Splitting, { CHARS, type SplittingProps, WORDS } from './index';
import userEvent from '@testing-library/user-event';

// TODO: https://github.com/sindresorhus/type-fest/issues/1311
const hasOwnNonNullish = <T extends object, K extends keyof T>(
  object: T | null | undefined | void,
  property: K
): object is T & {
  [P in K]-?: Exclude<T[P], null | undefined | void>;
} =>
  object != null &&
  Object.prototype.hasOwnProperty.call(object, property) &&
  (object as any)[property] != null;

const renderBothToHTML = async (
  props: SplittingProps | SplittingProps<keyof JSX.IntrinsicElements>
) => ({
  /**
   * The result of the React component.
   */
  component: (() => {
    let charCount = 0;
    let wordCount = 0;
    const html = renderReactToHTML(
      <Splitting
        {...props}
        onCharCount={count => {
          charCount = count;
          //props.onCharCount?.(count);
        }}
        onWordCount={count => {
          wordCount = count;
          //props.onWordCount?.(count);
        }}
      />
    );
    return { charCount, html, wordCount };
  })(),
  /**
   * The result of the original splitting.js library.
   */
  original: await (async () => {
    const {
      by,
      children,
      container,
      cssClasses,
      cssVariables,
      dataAttributes,
      onCharCount, // Unused, but omits from `domProps`
      onWordCount, // Unused, but omits from `domProps`
      whitespace,
      ...domProps
    } = props;
    const target = document.createElement(container ?? 'div');
    if (container) {
      const temp = document.createElement('div');
      temp.innerHTML = renderReactToHTML(createElement(container, domProps));
      for (const { name, value } of temp.firstElementChild?.attributes ?? []) {
        target.setAttribute(name, value);
      }
    }
    target.innerHTML = renderReactToHTML(children);
    //console.debug('BEFORE ORIGINAL:', div.outerHTML);
    const [{ chars, words }] = splitting({
      by,
      target,
      whitespace,
    });
    //console.debug('AFTER ORIGINAL (before normalization):', div.outerHTML);
    return {
      charCount: chars?.length ?? 0,
      html: (
        await htmlnano.process(container ? target.outerHTML : target.innerHTML, {
          custom: [
            tree =>
              tree.walk(node => {
                if (node?.attrs) {
                  // Remove CSS classes if the component does not render them
                  if (!cssClasses && hasOwnNonNullish(node.attrs, 'class')) {
                    node.attrs.class = node.attrs.class
                      ?.split(/\s+/)
                      .filter(
                        c => !['char', CHARS, 'word', WORDS, 'splitting', 'whitespace'].includes(c)
                      )
                      .join(' ');
                  }
                  // Remove CSS variables if the component does not render them
                  if (!cssVariables && hasOwnNonNullish(node.attrs, 'style')) {
                    node.attrs.style = node.attrs.style.replaceAll(
                      /--(char|word)-(index|total):\s*\d+;?/g,
                      ''
                    );
                  }
                  // Remove data-* attributes if the component does not render them
                  if (!dataAttributes) {
                    ['data-char', 'data-word'].forEach(attrName => {
                      if (hasOwnNonNullish(node.attrs, attrName)) {
                        delete node.attrs[attrName];
                      }
                    });
                  }
                }
                return node;
              }),
          ],
          minifyJs: false, // Suppress dependency warnings
          sortAttributes: true,
          sortAttributesWithLists: true,
        })
      ).html,
      wordCount: words?.length ?? 0,
    };
  })(),
});

const EMOJI_CHILDREN = <>text 👨‍👩‍👧‍👦⭐️</>;
const MULTIPLE_WORDS_CHILDREN = <>text1 text2</>;
const SINGLE_CHARACTER_CHILDREN = <>C</>;
const SINGLE_WORD_CHILDREN = <>text</>;

const STRUCTURED_CHILDREN = (() => {
  //const Component = () => <button>text3 text4</button>;
  return (
    <>
      {' '}
      <em className="persist">text1</em>{' '}
      <strong data-persist style={{ color: 'red' }}>
        text2
      </strong>
      {'\t\t'}
      <div>
        <div>{/*<Component />*/} </div>
      </div>{' '}
    </>
  );
})();

/**
 * Make--one or multiple--assertions that the React component produces the same results as the
 * original splitting.js library.
 */
const assertParity = async ({
  children = [
    SINGLE_CHARACTER_CHILDREN,
    SINGLE_WORD_CHILDREN,
    MULTIPLE_WORDS_CHILDREN,
    EMOJI_CHILDREN,
    STRUCTURED_CHILDREN,
  ],
  ...props
}: SplittingProps | SplittingProps<keyof JSX.IntrinsicElements>) => {
  if (!Array.isArray(children)) {
    children = [children];
  }
  for (const c of children) {
    const { component, original } = await renderBothToHTML({ children: c, ...props });
    //console.debug({
    //  '<Splitting/>': component.html,
    //  'splitting.js': original.html,
    //});
    expect(component).toEqual(original);
  }
};

describe('by', () => {
  ([CHARS, WORDS] as SplittingProps['by'][]).forEach(by =>
    describe(`"${by}"`, () => {
      it('works', async () => {
        await assertParity({ by });
        await assertParity({ by, children: [[], <></>, 0, 1, true, false, null, undefined] });
        renderReactToDOM(
          <Splitting by={by}>{createPortal(<div>text</div>, document.body)}</Splitting>
        );
      });

      if (by === CHARS) {
        it('is the default value', () => assertParity({ children: SINGLE_WORD_CHILDREN }));
      }

      // TODO: uncomment whitespace tests when possible: https://github.com/shshaw/Splitting/issues/76
      //it('supports container, cssClasses, cssVariables, dataAttributes and whitespace props', () =>
      it('supports container, cssClasses, cssVariables and dataAttributes props', () => {
        const variants = [
          { container: 'button' },
          { container: 'button', type: 'button' },
          { container: 'div' },
          { container: 'div', cssClasses: true },
          { container: 'div', cssVariables: true },
          { cssClasses: true },
          { cssVariables: true },
          //{ cssVariables: true, whitespace: true },
          { dataAttributes: true },
          //{ whitespace: true },
          {
            cssClasses: true,
            cssVariables: true,
            dataAttributes: true,
            //whitespace: true,
          },
          {
            container: 'div',
            cssClasses: true,
            cssVariables: true,
            dataAttributes: true,
            //whitespace: true,
          },
        ] satisfies (SplittingProps | SplittingProps<'button'> | SplittingProps<'div'>)[];
        return Promise.all(variants.map(props => assertParity({ by, ...props })));
      });

      // TODO: remove when above is fixed
      it('supports whitespace prop', () =>
        Promise.all(
          [
            { cssVariables: true, whitespace: true },
            { whitespace: true },
            {
              cssClasses: true,
              cssVariables: true,
              dataAttributes: true,
              whitespace: true,
            },
          ].map(props => assertParity({ by, children: MULTIPLE_WORDS_CHILDREN, ...props }))
        ));

      it('preserves user events', async () => {
        const handleClick = vi.fn();
        renderReactToDOM(
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

      it('ignores <script> and <style> elements', () => {
        const script = <script>window.alert("ok");</script>;
        const style = <style>{`html{--test:1;}`}</style>;
        expect(
          renderReactToHTML(
            <Splitting by={by}>
              text {script} {style}
            </Splitting>
          )
        ).toBe(
          renderReactToHTML(
            <>
              {by === CHARS ? (
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
    ['non-existent', null, 0, [], {}].forEach(by =>
      // @ts-expect-error unsupported values
      expect(() => renderReactToHTML(<Splitting by={by}>text</Splitting>)).toThrow(TypeError)
    ));
});
