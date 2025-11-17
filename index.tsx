import { Children, type ReactNode, useMemo } from 'react';

export const CHARS = 'chars';
export const WORDS = 'words';

export interface SplittingProps {
  /**
   * The splitting method.
   */
  by?: typeof CHARS | typeof WORDS;
  /**
   * When `true`, CSS classes will be rendered.
   */
  cssClasses?: boolean;
  /**
   * An optional key used as a prefix on CSS variables.
   */
  cssKey?: string;
  /**
   * When `true`, CSS variables will be rendered.
   */
  cssVariables?: boolean;
  children: ReactNode;
  /**
   * When `true`, data-* attributes will be rendered.
   */
  dataAttributes?: boolean;
}

/**
 * Split an element by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default ({
  by = CHARS,
  children,
  cssClasses = false,
  cssKey,
  cssVariables = false,
  dataAttributes = false,
}: SplittingProps) => {
  if (by !== CHARS && by !== WORDS) {
    throw new TypeError(`Splitting method must be "${CHARS}" or "${WORDS}"`);
  }

  // This needn't be state -- it's only used when `splitChildren` needs to update
  let partCount = 0;

  const splitChildren = useMemo(
    () =>
      Children.map(children, child => {
        if ((typeof child === 'bigint' || typeof child === 'number') && by === CHARS) {
          child = String(child);
        }
        if (typeof child === 'string') {
          return child.split(by === CHARS ? '' : /\s+/).map((part, j) => (
            <span
              className={
                cssClasses
                  ? part === ' '
                    ? 'whitespace'
                    : by === CHARS
                      ? 'char'
                      : 'word'
                  : undefined
              }
              data-char={dataAttributes && by === CHARS ? part : undefined}
              data-word={dataAttributes && by === WORDS ? part : undefined}
              key={j}
              style={{
                ...(cssVariables &&
                  (by === CHARS || by === WORDS) && {
                    [`--${cssKey}${singular(by)}-index`]: cssKey ? partCount++ : undefined,
                    [`--${singular(by)}-index`]: !cssKey ? partCount++ : undefined,
                  }),
              }}
            >
              {part}
            </span>
          ));
        } else {
          return child;
        }
      }),
    [by, children, cssClasses, cssKey, cssVariables, dataAttributes]
  );

  return splitChildren;
};

const singular = (by: NonNullable<SplittingProps['by']>) =>
  by === WORDS ? 'word' : by === CHARS ? 'char' : '';
