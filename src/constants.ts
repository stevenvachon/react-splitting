export const COLLAPSED_WHITESPACE = ' ' as const;

export const SEGMENT_TAG_NAME = 'span' as const;

export enum Segmentation {
  CHARS = 'chars',
  WORDS = 'words',
}
