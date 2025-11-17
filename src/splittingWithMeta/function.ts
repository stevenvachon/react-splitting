import type {
  CharPropsCallback,
  CharsProps_CountingWhitespace_WithWordElements,
  CharsProps_DiscountingWhitespace_WithWordElements,
  DomProps,
  Tags,
  WordPropsCallback,
  WordsProps_WithWhitespaceElements,
} from '../types';
import { COLLAPSED_WHITESPACE, Segmentation } from '../constants';
import { createElement, type ReactNode } from 'react';
import split from '../split';

const CHAR = 'char';
const WORD = 'word';

type OmittedProps =
  | 'charProps'
  | 'content'
  | 'omitWhitespaceElements'
  | 'omitWordElements'
  | 'wordProps';

export type SplittingWithMetaFunctionProps<T extends keyof Tags> = (
  | Omit<CharsProps_CountingWhitespace_WithWordElements, OmittedProps>
  | Omit<CharsProps_DiscountingWhitespace_WithWordElements, OmittedProps>
  | Omit<WordsProps_WithWhitespaceElements, OmittedProps>
) &
  DomProps<T> & {
    /**
     * The containing element's tag name.
     */
    as: T;
    /**
     * An optional key used as a prefix on CSS variables.
     */
    cssKey?: string;
  };

/**
 * Split text and elements by words or characters.
 * A re-implementation of splitting for React supporting SSR/SSG.
 *
 * @throws {TypeError} If `by` is not a `Segmentation`.
 */
export default <T extends keyof Tags>(
  input: ReactNode,
  {
    as,
    by = Segmentation.CHARS,
    className,
    cssKey,
    style,
    whitespace,
    ...domProps
  }: SplittingWithMetaFunctionProps<T>
) => {
  cssKey = cssKey ? `${cssKey}-` : '';

  const charProps: CharPropsCallback = (i, char) => ({
    className: char === COLLAPSED_WHITESPACE ? 'whitespace' : CHAR,
    [`data-${CHAR}`]: char === COLLAPSED_WHITESPACE ? undefined : char,
    style: {
      [`--${cssKey}${CHAR}-index`]:
        char !== COLLAPSED_WHITESPACE ||
        (char === COLLAPSED_WHITESPACE && whitespace && by === Segmentation.CHARS)
          ? i
          : undefined,
    },
  });

  const wordProps: WordPropsCallback = (i, word) => ({
    className: WORD,
    [`data-${WORD}`]: word,
    style: {
      [`--${cssKey}${WORD}-index`]: i,
    },
  });

  const quirks = true;

  const { charCount, segments, wordCount } = split(
    input,
    by === Segmentation.CHARS
      ? { by, charProps, quirks, wordProps, whitespace }
      : { by, charProps, quirks, wordProps }
  );

  const container = createElement(
    as,
    {
      ...(domProps as Omit<DomProps<T>, 'className' | 'style'>), // Ugh
      className: [
        by === Segmentation.CHARS ? Segmentation.CHARS : '',
        'splitting',
        Segmentation.WORDS,
        className,
      ]
        .filter(s => s)
        .join(' '),
      style: {
        // Matched order with original; since tests cannot sort CSS variables
        [`--${cssKey}${WORD}-total`]: wordCount,
        [`--${cssKey}${CHAR}-total`]: by === Segmentation.CHARS ? charCount : undefined,
        ...style,
      },
    },
    segments
  );

  return { charCount, container, wordCount };
};
