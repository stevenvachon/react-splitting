import type { CHARS, COLLAPSED_WHITESPACE, SEGMENT_TAG_NAME, WORDS } from './constants.js'; // Not *.ts because this file is not compiled
import type { JSX, ReactNode } from 'react';

export type Tags = JSX.IntrinsicElements;
export type DomProps<T extends keyof Tags> = Tags[T];
export type SegmentAttributes = Tags[typeof SEGMENT_TAG_NAME];

export type CharPropsCallback = (index: number, char: string) => SegmentAttributes | void;
export type WordPropsCallback = (index: number, word: string) => SegmentAttributes | void;

// For explicit casting
export type ContentCallback_Chars_CountingWhitespace = (
  index: number,
  charOrWhitespace: string
) => ReactNode;

// For explicit casting
export type ContentCallback_Chars_DiscountingWhitespace = (
  index: number | undefined,
  charOrWhitespace: string
) => ReactNode;

// For explicit casting
export type ContentCallback_Chars_Char = (index: number, char: string) => ReactNode;

// For consumer convenience
export type ContentCallback_Chars = ContentCallback_Chars_DiscountingWhitespace;

// For consumer convenience
export type ContentCallback_Words = (
  index: number | undefined,
  wordOrWhitespace: string
) => ReactNode;

// For explicit casting
export type ContentCallback_Words_Whitespace = (
  index: undefined,
  whitespace: typeof COLLAPSED_WHITESPACE
) => ReactNode;

// For explicit casting
export type ContentCallback_Words_Word = (index: number, word: string) => ReactNode;

interface CharsPropsBase {
  /**
   * The splitting method.
   */
  by?: typeof CHARS;
  /**
   * A callback to customize the properties for each character's element.
   * It will not be called for whitespace characters when `omitWhitespaceElements` is `true`.
   */
  charProps?: CharPropsCallback;
}

export interface CharsProps_CountingWhitespace_WithoutWordElements extends CharsPropsBase {
  /**
   * A callback to customize the contents of each character's element.
   */
  content?: ContentCallback_Chars_CountingWhitespace;
  omitWhitespaceElements?: never;
  /**
   * When `true`, the `<span>` element for each word will not be created.
   */
  omitWordElements: true;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace: true;
  wordProps?: never;
}

export interface CharsProps_CountingWhitespace_WithWordElements extends CharsPropsBase {
  /**
   * A callback to customize the contents of each character's element.
   */
  content?: ContentCallback_Chars_CountingWhitespace;
  omitWhitespaceElements?: never;
  /**
   * When `true`, the `<span>` element for each word will not be created.
   */
  omitWordElements?: false;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace: true;
  /**
   * A callback to customize the properties for each word's element.
   */
  wordProps?: WordPropsCallback;
}

export interface CharsProps_DiscountingWhitespace_WithoutWordElements extends CharsPropsBase {
  /**
   * A callback to customize the contents of each character's element.
   * `index` will be `undefined` when `wordOrWhitespace` is a whitespace-only string.
   */
  content?: ContentCallback_Chars_DiscountingWhitespace;
  /**
   * When `true`, the `<span>` element for each whitespace character will not be created.
   */
  omitWhitespaceElements?: boolean;
  /**
   * When `true`, the `<span>` element for each word will not be created.
   */
  omitWordElements: true;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace?: false;
  wordProps?: never;
}

export interface CharsProps_DiscountingWhitespace_WithWordElements extends CharsPropsBase {
  /**
   * A callback to customize the contents of each character's element.
   * `index` will be `undefined` when `wordOrWhitespace` is a whitespace-only string.
   */
  content?: ContentCallback_Chars_DiscountingWhitespace;
  /**
   * When `true`, the `<span>` element for each whitespace character will not be created.
   */
  omitWhitespaceElements?: boolean;
  /**
   * When `true`, the `<span>` element for each word will not be created.
   */
  omitWordElements?: false;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace?: false;
  /**
   * A callback to customize the properties for each word's element.
   */
  wordProps?: WordPropsCallback;
}

interface WordsPropsBase {
  /**
   * The splitting method.
   */
  by: typeof WORDS;
  /**
   * A callback to customize the contents of each word's element.
   * `index` will be `undefined` when `wordOrWhitespace` is a whitespace-only string.
   */
  content?: ContentCallback_Words;
  omitWordElements?: never;
  whitespace?: never;
  /**
   * A callback to customize the properties for each word's element.
   */
  wordProps?: WordPropsCallback;
}

export interface WordsProps_WithoutWhitespaceElements extends WordsPropsBase {
  charProps?: never;
  /**
   * When `true`, the `<span>` element for each whitespace character will not be created.
   */
  omitWhitespaceElements: true;
}

export interface WordsProps_WithWhitespaceElements extends WordsPropsBase {
  /**
   * A callback to customize the properties for each character's element.
   * Note: It _will_ be called even if `by === WORDS` for whitespace characters.
   */
  charProps?: CharPropsCallback;
  /**
   * When `true`, the `<span>` element for each whitespace character will not be created.
   */
  omitWhitespaceElements?: false;
}

export interface ComponentsBaseProps {
  children?: ReactNode;
}
