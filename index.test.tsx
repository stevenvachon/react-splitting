import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render as renderReactToDOM, screen } from '@testing-library/react';
import { createPortal } from 'react-dom';
import htmlnano from 'htmlnano';
import { renderToStaticMarkup as renderReactToHTML } from 'react-dom/server';
import type { SetOptional } from 'type-fest';
import splitting from 'splitting';
import Splitting, { CHARS, type SplittingProps, WORDS } from './index';
import userEvent from '@testing-library/user-event';

const renderBothToHTML = async (props: SplittingProps) => ({
  /**
   * The result of the React component.
   */
  component: (() => {
    let charCount = 0;
    let wordCount = 0;
    const html = renderReactToHTML(
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
    div.innerHTML = renderReactToHTML(props.children);
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
}: SetOptional<SplittingProps, 'children'>) => {
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

// This should've been ran automatically; strange
afterEach(() => cleanup());

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
      //it('supports cssClasses, cssKey, cssVariables, dataAttributes and whitespace props', () =>
      it('supports cssClasses, cssKey, cssVariables and dataAttributes props', () =>
        Promise.all(
          [
            { cssClasses: true },
            { cssVariables: true },
            { cssVariables: true, cssKey: 'custom' },
            //{ cssVariables: true, whitespace: true },
            { dataAttributes: true },
            //{ whitespace: true },
            {
              cssClasses: true,
              cssKey: 'custom',
              cssVariables: true,
              dataAttributes: true,
              //whitespace: true,
            },
          ].map(props => assertParity({ by, ...props }))
        ));

      // TODO: remove when above is fixed
      it('supports whitespace prop', () =>
        Promise.all(
          [
            { cssVariables: true, whitespace: true },
            { whitespace: true },
            {
              cssClasses: true,
              cssKey: 'custom',
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
    })
  );

  it('throws an error for invalid values', () =>
    ['non-existent', null, 0, [], {}].forEach(by =>
      // @ts-expect-error unsupported values
      expect(() => renderReactToHTML(<Splitting by={by}>text</Splitting>)).toThrow(TypeError)
    ));
});
