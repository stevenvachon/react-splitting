import {
  CHARS,
  splittingWithMeta,
  type SplittingWithMetaFunctionProps,
  WORDS,
} from './splittingWithMeta/index';
import { Children, createElement, ReactNode } from 'react';
import { expect } from 'vitest';
import originalSplitting from 'splitting';
import { process as htmlnano } from 'htmlnano';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SetOptional } from 'type-fest';
import type { Tags } from './types';

export const DEFAULT_TAG = 'div';

export const byIsChars = (by: typeof CHARS | typeof WORDS | undefined) =>
  by === CHARS || by === undefined;

export const formatBy = (by: typeof CHARS | typeof WORDS | undefined) =>
  typeof by === 'string' ? `"${by}"` : String(by);

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

type NormalizeHTMLOptions<T extends keyof Tags> = Pick<
  SplittingWithMetaFunctionProps<T>,
  'cssKey'
> & {
  removeCSSClasses?: boolean;
  removeCSSVariables?: boolean;
  removeDataAttributes?: boolean;
};

const normalizeHTML = <T extends keyof Tags>(
  html: string,
  {
    cssKey,
    removeCSSClasses = false,
    removeCSSVariables = false,
    removeDataAttributes = false,
  }: NormalizeHTMLOptions<T> = {}
) =>
  htmlnano(html, {
    custom: [
      tree =>
        tree.walk(node => {
          if (node?.attrs) {
            // TODO: remove when possible: https://github.com/shshaw/Splitting/issues/110
            if (cssKey && hasOwnNonNullish(node.attrs, 'style')) {
              node.attrs.style = node.attrs.style.replaceAll(
                new RegExp(`---${cssKey}(char|word)-(index|total):(\\s*\\d+;?)`, 'g'),
                `--${cssKey}-$1-$2:$3`
              );
            }
            if (removeCSSClasses && hasOwnNonNullish(node.attrs, 'class')) {
              node.attrs.class = node.attrs.class
                ?.split(/\s+/)
                .filter(c => !['char', CHARS, 'word', WORDS, 'splitting', 'whitespace'].includes(c))
                .join(' ');
            }
            if (removeCSSVariables && hasOwnNonNullish(node.attrs, 'style')) {
              node.attrs.style = node.attrs.style.replaceAll(
                cssKey
                  ? new RegExp(`--${cssKey}-(char|word)-(index|total):\\s*\\d+;?`, 'g')
                  : /--(char|word)-(index|total):\s*\d+;?/g,
                ''
              );
            }
            if (removeDataAttributes) {
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
  }).then(({ html }) => html);

type SplittingWithMetaFunctionPropsWithInput<T extends keyof Tags> =
  SplittingWithMetaFunctionProps<T> & {
    input: ReactNode;
  };

/**
 * Render both the React component and the original splitting.js library.
 */
const renderBothToNormalizedHTML = async <T extends keyof Tags>({
  as,
  by,
  cssKey,
  input,
  whitespace,
  ...domProps
}: SplittingWithMetaFunctionPropsWithInput<T>) => ({
  /**
   * The result of the React component.
   */
  component: await (async () => {
    const { charCount, container, wordCount } = splittingWithMeta(input, {
      as,
      by,
      cssKey,
      whitespace,
      ...(domProps as any), // Avoids "too complex" error
    });
    const html = await renderReactToNormalizedHTML(container);
    return { charCount, html, wordCount };
  })(),
  /**
   * The result of the original splitting.js library.
   */
  original: await (async () => {
    const target = document.createElement(as);
    // Add attributes -- START
    const temp = document.createElement('div');
    temp.innerHTML = renderToStaticMarkup(
      createElement(
        as,
        //domProps as Tags[T]
        domProps as any // Avoids "too complex" error
      )
    );
    for (const { name, value } of temp.firstElementChild?.attributes ?? []) {
      target.setAttribute(name, value);
    }
    // Add attributes -- END
    target.innerHTML = renderToStaticMarkup(input);
    //console.debug('BEFORE ORIGINAL:', target.outerHTML);
    const [{ chars, words }] = originalSplitting({ by, key: cssKey, target, whitespace });
    //console.debug('AFTER ORIGINAL (before normalization):', target.outerHTML);
    return {
      charCount: chars?.length ?? 0,
      html: await normalizeHTML(target.outerHTML, { cssKey }),
      wordCount: words?.length ?? 0,
    };
  })(),
});

// TODO: use `Promise.try` when possible (stupid TypeScript)
const renderReactToNormalizedHTML = async <T extends keyof Tags>(
  element: Parameters<typeof renderToStaticMarkup>[0],
  normalize?: false | NormalizeHTMLOptions<T>
) => {
  const html = renderToStaticMarkup(element);
  if (normalize === false) {
    return html;
  } else {
    //console.debug('AFTER REACT (before normalization):', html);
    return normalizeHTML(html, normalize);
  }
};

const renderReactToHTML = (element: Parameters<typeof renderToStaticMarkup>[0]) =>
  renderToStaticMarkup(element);

export { renderReactToHTML as renderToHTML, renderReactToNormalizedHTML as renderToNormalizedHTML };

export const EMOJI_INPUT = <>text 👨‍👩‍👧‍👦⭐️</>;
export const MULTIPLE_WORDS_INPUT = <>text1 text2</>;
export const SINGLE_CHARACTER_INPUT = <>C</>;
export const SINGLE_WORD_INPUT = <>text</>;

export const STRUCTURED_CHILDREN = (() => {
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
export const assertParity = async <T extends keyof Tags = typeof DEFAULT_TAG>(
  props: SetOptional<SplittingWithMetaFunctionPropsWithInput<T>, 'input'>
) => {
  const {
    input = [
      SINGLE_CHARACTER_INPUT,
      SINGLE_WORD_INPUT,
      MULTIPLE_WORDS_INPUT,
      EMOJI_INPUT,
      STRUCTURED_CHILDREN,
    ],
  } = props; // Ugh
  for (const elm of Children.toArray(input)) {
    const { component, original } = await renderBothToNormalizedHTML(
      { ...props, input: elm } as SplittingWithMetaFunctionPropsWithInput<T> // Ugh
    );
    //console.debug({
    //  '<SplittingWithMeta />': component.html,
    //  'original splitting.js': original.html,
    //});
    expect(component).toEqual(original);
  }
};
