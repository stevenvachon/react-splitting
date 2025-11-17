import { Children, type ReactNode, useMemo } from 'react';

export const CHARS = 'chars';
export const WORDS = 'words';

export interface SplittingProps {
  /**
   * The splitting method.
   */
  by?: typeof CHARS | typeof WORDS;
  /**
   * Renders CSS classes when true.
   */
  cssClasses?: boolean;
  /**
   * Renders CSS variables when true.
   */
  cssVariables?: boolean;
  children: ReactNode;
  /**
   * Renders data-* attributes when true.
   */
  dataAttributes?: boolean;
  /**
   * An optional key used as a prefix on CSS Variables.
   */
  key?: string;
}

/**
 * Split an element by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default ({
  by = CHARS,
  children,
  cssClasses = false,
  cssVariables = false,
  dataAttributes = false,
  key,
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
                    [`--${key}${singular(by)}-index`]: key ? partCount++ : undefined,
                    [`--${singular(by)}-index`]: !key ? partCount++ : undefined,
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
    [by, children, cssClasses, cssVariables, dataAttributes, key]
  );

  return splitChildren;
};

const singular = (by: NonNullable<SplittingProps['by']>) =>
  by === WORDS ? 'word' : by === CHARS ? 'char' : '';
