import type { CHARS, COLLAPSED_WHITESPACE, SEGMENT_TAG_NAME, WORDS } from './constants.js'; // Not *.ts because this file is not compiled
import type { JSX, ReactNode } from 'react';

export type Tags = JSX.IntrinsicElements;
export type DomProps<T extends keyof Tags> = Tags[T];
export type SegmentAttributes = Tags[typeof SEGMENT_TAG_NAME];

export type CharPropsCallback = (index: number, char: string) => SegmentAttributes | void;
export type WordPropsCallback = (index: number, word: string) => SegmentAttributes | void;

// For consumer convenience
export type ContentCallback = (index: number | undefined, segmentOrWhitespace: string) => ReactNode;

// For explicit casting
export type ContentCallback_DiscountedWhitespace = (
  index: undefined,
  whitespace: typeof COLLAPSED_WHITESPACE
) => ReactNode;

// For explicit casting
export type ContentCallback_Segment = (index: number, segment: string) => ReactNode;

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
  content?: ContentCallback_Segment;
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
  content?: ContentCallback_Segment;
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
   * `index` will be `undefined` when `segmentOrWhitespace` is a whitespace-only string.
   */
  content?: ContentCallback | ContentCallback_Segment | ContentCallback_DiscountedWhitespace;
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
   * `index` will be `undefined` when `segmentOrWhitespace` is a whitespace-only string.
   */
  content?: ContentCallback | ContentCallback_Segment | ContentCallback_DiscountedWhitespace;
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
   * `index` will be `undefined` when `segmentOrWhitespace` is a whitespace-only string.
   */
  content?: ContentCallback | ContentCallback_Segment | ContentCallback_DiscountedWhitespace;
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
