import type {
  CharsProps_CountingWhitespace_WithoutWordElements,
  CharsProps_CountingWhitespace_WithWordElements,
  CharsProps_DiscountingWhitespace_WithoutWordElements,
  CharsProps_DiscountingWhitespace_WithWordElements,
  ContentCallback_DiscountedWhitespace,
  ContentCallback_Segment,
  WordsProps_WithoutWhitespaceElements,
  WordsProps_WithWhitespaceElements,
} from './types';
import { Children, cloneElement, createElement, isValidElement, type ReactNode } from 'react';
import { COLLAPSED_WHITESPACE, SEGMENT_TAG_NAME, Segmentation } from './constants';
import type { SetRequired } from 'type-fest';

export type SplitBaseProps =
  | CharsProps_CountingWhitespace_WithoutWordElements
  | CharsProps_CountingWhitespace_WithWordElements
  | CharsProps_DiscountingWhitespace_WithoutWordElements
  | CharsProps_DiscountingWhitespace_WithWordElements
  | WordsProps_WithoutWhitespaceElements
  | WordsProps_WithWhitespaceElements;

export type SplitProps = SplitBaseProps & {
  /**
   * When `true`, some questionable behaviors from the original (v1.1.0) are preserved.
   */
  quirks?: boolean;
};

type StrictSplitProps = SetRequired<SplitProps, 'by'>;

/**
 * @throws {TypeError} If `by` is not a `Segmentation`.
 */
export default (input: ReactNode, { by = Segmentation.CHARS, ...props }: SplitProps = {}) => {
  if (by !== Segmentation.CHARS && by !== Segmentation.WORDS) {
    throw new TypeError(
      `Segmentation method must be "${Segmentation.CHARS}" or "${Segmentation.WORDS}".`
    );
  }
  return split(input, { by, ...props } as StrictSplitProps); // Ugh
};

const isNotEmptyString = (t: string) => !!t;
const WHITESPACE_CAPTURED = /(\s+)/;
const WHITESPACE_ONLY = /^\s+$/;

type SegmenterOptions = ConstructorParameters<typeof Intl.Segmenter>[1];
const WORD_GRANULARITY: SegmenterOptions = { granularity: 'word' };

const split = (
  input: ReactNode,
  props: StrictSplitProps,
  count = { chars: 0, words: 0 }
): { charCount: number; segments: ReactNode; wordCount: number } => {
  const {
    by,
    charProps,
    content,
    locale = 'en',
    omitWhitespaceElements = false,
    omitWordElements = false,
    quirks = false,
    whitespace = false,
    wordProps,
  } = props;
  const segments = Children.map(input, child => {
    if (typeof child === 'bigint' || typeof child === 'boolean' || typeof child === 'number') {
      child = String(child);
    }
    if (typeof child === 'string') {
      return (
        quirks
          ? // Split by and include whitespace delimiters
            child.split(WHITESPACE_CAPTURED).filter(isNotEmptyString)
          : Array.from(
              new Intl.Segmenter(locale, WORD_GRANULARITY).segment(child),
              ({ segment }) => segment
            )
      ).map((segment, segmentIndex) => {
        if (WHITESPACE_ONLY.test(segment)) {
          if (!segmentIndex && quirks) {
            return; // Strange, but conforms to original behavior
          }
          if (by === Segmentation.CHARS && whitespace) {
            count.chars++; // Only one due to collapse
          }
          const whitespaceContent = content
            ? by === Segmentation.CHARS && whitespace
              ? (content as ContentCallback_Segment)(count.chars - 1, COLLAPSED_WHITESPACE)
              : (content as ContentCallback_DiscountedWhitespace)(undefined, COLLAPSED_WHITESPACE)
            : COLLAPSED_WHITESPACE;
          return omitWhitespaceElements
            ? whitespaceContent
            : createElement(
                SEGMENT_TAG_NAME,
                {
                  key: segmentIndex,
                  ...charProps?.(count.chars - 1, COLLAPSED_WHITESPACE),
                },
                whitespaceContent
              );
        }
        count.words++;
        const charOrWordContent =
          by === Segmentation.CHARS
            ? Array.from(new Intl.Segmenter().segment(segment), ({ segment: char }, charIndex) => {
                count.chars++;
                return createElement(
                  SEGMENT_TAG_NAME,
                  {
                    key: charIndex,
                    ...charProps?.(count.chars - 1, char),
                  },
                  content ? (content as ContentCallback_Segment)(count.chars - 1, char) : char
                );
              })
            : content
              ? (content as ContentCallback_Segment)(count.words - 1, segment)
              : segment;
        return by === Segmentation.CHARS && omitWordElements
          ? charOrWordContent
          : createElement(
              SEGMENT_TAG_NAME,
              { key: segmentIndex, ...wordProps?.(count.words - 1, segment) },
              charOrWordContent
            );
      });
    } else if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.type !== 'script' &&
      child.type !== 'style'
    ) {
      // Preserve the element, but replace its children
      return cloneElement(child, undefined, split(child.props.children, props, count).segments);
    } else {
      return child;
    }
  });
  return {
    charCount: count.chars,
    segments,
    wordCount: count.words,
  };
};
