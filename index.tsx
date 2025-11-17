import { Children, cloneElement, isValidElement, type ReactNode, useMemo } from 'react';

export const CHARS = 'chars' as const;
export const WORDS = 'words' as const;

export interface SplittingProps {
  /**
   * The splitting method.
   */
  by?: typeof CHARS | typeof WORDS;
  children?: ReactNode;
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
  /**
   * When `true`, data-* attributes will be rendered.
   */
  dataAttributes?: boolean;
  /**
   * A callback fired after counting is complete.
   */
  onCount?: (wordCount: number, charCount: number) => void;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace?: boolean;
}

/**
 * Split children by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default ({
  by = CHARS,
  children,
  cssClasses = false,
  cssKey,
  cssVariables = false,
  dataAttributes = false,
  onCount,
  whitespace = false,
}: SplittingProps) => {
  if (by !== CHARS && by !== WORDS) {
    throw new TypeError(`Splitting method must be "${CHARS}" or "${WORDS}"`);
  }
  return useMemo(() => {
    const {
      charCount,
      children: splittedChildren,
      wordCount,
    } = splitChildren(children, {
      by,
      cssClasses,
      //cssKey: cssKey ? `${cssKey}-` : '',
      cssKey: cssKey ? `-${cssKey}` : '', // https://github.com/shshaw/Splitting/issues/110
      cssVariables,
      dataAttributes,
      whitespace,
    });
    onCount?.(wordCount, charCount);
    return splittedChildren;
  }, [by, children, cssClasses, cssKey, cssVariables, dataAttributes, onCount, whitespace]);
};

const CHAR = 'char';
const WORD = 'word';

const splitChildren = (
  children: ReactNode,
  props: Omit<SplittingProps, 'children' | 'onCount'>,
  count = { chars: 0, words: 0 }
): { charCount: number; children: ReactNode; wordCount: number } => {
  const splittedChildren = Children.map(children, child => {
    if (typeof child === 'bigint' || typeof child === 'boolean' || typeof child === 'number') {
      child = String(child);
    }
    if (typeof child === 'string') {
      const { by, cssClasses, cssKey, cssVariables, dataAttributes, whitespace } = props;
      return child
        .split(/(\s+)/) // Include whitespace delimiters
        .filter(t => t) // Remove empty strings
        .map((part, partIndex) => {
          if (/^\s+$/.test(part)) {
            if (!partIndex) {
              // Strange, but conforms to original behavior
              return;
            }
            if (by === CHARS && whitespace) {
              count.chars++; // Only one due to collapse
            }
            return (
              <span
                className={cssClasses ? 'whitespace' : undefined}
                key={partIndex}
                style={{
                  ...(cssVariables &&
                    by === CHARS &&
                    whitespace && {
                      [`--${cssKey}${CHAR}-index`]: count.chars - 1, // 0-based
                    }),
                }}
              >
                {/* Collapse whitespace */}{' '}
              </span>
            );
          }
          count.words++;
          return (
            <span
              className={cssClasses ? WORD : undefined}
              data-word={dataAttributes ? part : undefined}
              key={partIndex}
              style={{
                ...(cssVariables && {
                  [`--${cssKey}${WORD}-index`]: count.words - 1, // 0-based
                }),
              }}
            >
              {by === CHARS
                ? [...new Intl.Segmenter().segment(part)].map(({ segment: char }, charIndex) => {
                    count.chars++;
                    return (
                      <span
                        className={cssClasses ? CHAR : undefined}
                        data-char={dataAttributes ? char : undefined}
                        key={charIndex}
                        style={{
                          ...(cssVariables && {
                            [`--${cssKey}${CHAR}-index`]: count.chars - 1, // 0-based
                          }),
                        }}
                      >
                        {char}
                      </span>
                    );
                  })
                : part}
            </span>
          );
        });
    } else if (isValidElement<{ children?: ReactNode }>(child)) {
      // Preserve the element, but replace its children
      return cloneElement(
        child,
        child.props,
        splitChildren(child.props.children, props, count).children
      );
    } else {
      return child;
    }
  });
  return {
    charCount: count.chars,
    children: splittedChildren,
    wordCount: count.words,
  };
};
