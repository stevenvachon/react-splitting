import type {
  CharsProps_CountingWhitespace_WithoutWordElements,
  CharsProps_CountingWhitespace_WithWordElements,
  CharsProps_DiscountingWhitespace_WithoutWordElements,
  CharsProps_DiscountingWhitespace_WithWordElements,
  ContentCallback_Chars_Char,
  ContentCallback_Chars_DiscountingWhitespace,
  ContentCallback_Words_Whitespace,
  ContentCallback_Words_Word,
  WordsProps_WithoutWhitespaceElements,
  WordsProps_WithWhitespaceElements,
} from './types';
import { CHARS, COLLAPSED_WHITESPACE, CONTAINER_TAG_NAME, WORDS } from './constants';
import { Children, cloneElement, createElement, isValidElement, type ReactNode } from 'react';
import { SetRequired } from 'type-fest';

export type SplitBaseProps =
  | CharsProps_CountingWhitespace_WithoutWordElements
  | CharsProps_CountingWhitespace_WithWordElements
  | CharsProps_DiscountingWhitespace_WithoutWordElements
  | CharsProps_DiscountingWhitespace_WithWordElements
  | WordsProps_WithoutWhitespaceElements
  | WordsProps_WithWhitespaceElements;

export type SplitProps = SplitBaseProps & {
  /**
   * When `true`, some questionable behaviors from the original are preserved.
   */
  quirks?: boolean;
};

type StrictSplitProps = SetRequired<SplitProps, 'by'>;

export default (input: ReactNode, { by = CHARS, ...props }: SplitProps = {}) => {
  if (by !== CHARS && by !== WORDS) {
    throw new TypeError(`Splitting method must be "${CHARS}" or "${WORDS}"`);
  }
  return split(input, { by, ...props } as StrictSplitProps); // Ugh
};

const split = (
  input: ReactNode,
  props: StrictSplitProps,
  count = { chars: 0, words: 0 }
): { charCount: number; result: ReactNode; wordCount: number } => {
  const {
    by,
    charProps,
    content,
    omitWhitespaceElements = false,
    omitWordElements = false,
    quirks = false,
    whitespace = false,
    wordProps,
  } = props;
  const splitInput = Children.map(input, child => {
    if (typeof child === 'bigint' || typeof child === 'boolean' || typeof child === 'number') {
      child = String(child);
    }
    if (typeof child === 'string') {
      return child
        .split(/(\s+)/) // Include whitespace delimiters
        .filter(t => t) // Remove empty strings
        .map((part, partIndex) => {
          if (/^\s+$/.test(part)) {
            if (!partIndex && quirks) {
              return; // Strange, but conforms to original behavior
            }
            if (by === CHARS && whitespace) {
              count.chars++; // Only one due to collapse
            }
            const whitespaceContent = content
              ? by === CHARS
                ? whitespace
                  ? content(count.chars - 1, COLLAPSED_WHITESPACE)
                  : (content as ContentCallback_Chars_DiscountingWhitespace)(
                      undefined,
                      COLLAPSED_WHITESPACE
                    )
                : (content as ContentCallback_Words_Whitespace)(undefined, COLLAPSED_WHITESPACE)
              : COLLAPSED_WHITESPACE;
            return omitWhitespaceElements
              ? whitespaceContent
              : createElement(
                  CONTAINER_TAG_NAME,
                  {
                    key: partIndex,
                    ...charProps?.(count.chars - 1, COLLAPSED_WHITESPACE),
                  },
                  whitespaceContent
                );
          }
          count.words++;
          const charOrWordContent =
            by === CHARS
              ? [...new Intl.Segmenter().segment(part)].map(({ segment: char }, charIndex) => {
                  count.chars++;
                  return createElement(
                    CONTAINER_TAG_NAME,
                    {
                      key: charIndex,
                      ...charProps?.(count.chars - 1, char),
                    },
                    content ? (content as ContentCallback_Chars_Char)(count.chars - 1, char) : char
                  );
                })
              : content
                ? (content as ContentCallback_Words_Word)(count.words - 1, part)
                : part;
          return by === CHARS && omitWordElements
            ? charOrWordContent
            : createElement(
                CONTAINER_TAG_NAME,
                { key: partIndex, ...wordProps?.(count.words - 1, part) },
                charOrWordContent
              );
        });
    } else if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.type !== 'script' &&
      child.type !== 'style'
    ) {
      // Preserve the element, but replace its children
      return cloneElement(child, child.props, split(child.props.children, props, count).result);
    } else {
      return child;
    }
  });
  return {
    charCount: count.chars,
    result: splitInput,
    wordCount: count.words,
  };
};
