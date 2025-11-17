import {
  Children,
  cloneElement,
  type ComponentPropsWithoutRef,
  createElement,
  isValidElement,
  type JSX,
  type ReactNode,
  useMemo,
} from 'react';

export const CHARS = 'chars' as const;
export const WORDS = 'words' as const;

interface PropsBase {
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
   * A callback that is called after counting is complete.
   */
  onCount?: (wordCount: number, charCount: number) => void;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace?: boolean;
}

interface WithoutContainer {
  container?: never;
}

type WithContainer<T extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithoutRef<T>,
  keyof PropsBase
> & {
  container: T;
};

type AllNeverPartial<T> = Partial<Record<keyof T, never>>;
type DEFAULT_CONTAINER = 'div';

export type SplittingProps<T extends keyof JSX.IntrinsicElements = DEFAULT_CONTAINER> = PropsBase &
  (WithContainer<T> | (WithoutContainer & AllNeverPartial<WithContainer<T>>));

/**
 * Split children by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default <T extends keyof JSX.IntrinsicElements = DEFAULT_CONTAINER>({
  by = CHARS,
  children,
  className,
  container,
  cssClasses = false,
  cssKey = '',
  cssVariables = false,
  dataAttributes = false,
  onCount,
  style,
  whitespace = false,
  ...domProps
}: SplittingProps<T>) => {
  if (by !== CHARS && by !== WORDS) {
    throw new TypeError(`Splitting method must be "${CHARS}" or "${WORDS}"`);
  }

  if (cssKey) {
    cssKey = `${cssKey}-`;
  }

  const {
    charCount,
    children: splittedChildren,
    wordCount,
  } = useMemo(() => {
    const result = splitChildren(children, {
      by,
      cssClasses,
      cssKey,
      cssVariables,
      dataAttributes,
      whitespace,
    });
    onCount?.(result.wordCount, result.charCount);
    return result;
  }, [by, children, cssClasses, cssKey, cssVariables, dataAttributes, onCount, whitespace]);

  if (container) {
    return createElement(
      container,
      {
        ...(domProps as Omit<ComponentPropsWithoutRef<T>, 'children' | 'className' | 'style'>),
        className: cssClasses
          ? [by === CHARS ? CHARS : '', 'splitting', WORDS, className].filter(s => s).join(' ')
          : className,
        style: {
          ...(cssVariables
            ? {
                // Matched order with original; since tests can't sort CSS variables
                [`--${cssKey}${WORD}-total`]: wordCount,
                [`--${cssKey}${CHAR}-total`]: by === CHARS ? charCount : undefined,
              }
            : undefined),
          ...style,
        },
      },
      splittedChildren
    );
  } else {
    return splittedChildren;
  }
};

const CHAR = 'char';
const WORD = 'word';

const splitChildren = (
  children: ReactNode,
  props: Omit<PropsBase, 'children' | 'onCount'>,
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
                style={
                  cssVariables && by === CHARS && whitespace
                    ? {
                        [`--${cssKey}${CHAR}-index`]: count.chars - 1, // 0-based
                      }
                    : undefined
                }
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
              style={
                cssVariables
                  ? {
                      [`--${cssKey}${WORD}-index`]: count.words - 1, // 0-based
                    }
                  : undefined
              }
            >
              {by === CHARS
                ? [...new Intl.Segmenter().segment(part)].map(({ segment: char }, charIndex) => {
                    count.chars++;
                    return (
                      <span
                        className={cssClasses ? CHAR : undefined}
                        data-char={dataAttributes ? char : undefined}
                        key={charIndex}
                        style={
                          cssVariables
                            ? {
                                [`--${cssKey}${CHAR}-index`]: count.chars - 1, // 0-based
                              }
                            : undefined
                        }
                      >
                        {char}
                      </span>
                    );
                  })
                : part}
            </span>
          );
        });
    } else if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.type !== 'script' &&
      child.type !== 'style'
    ) {
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
