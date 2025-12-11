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
  /**
   * Customize the properties for each character's element.
   */
  charProps?: {
    (index: number, isWhitespace: true): JSX.IntrinsicElements['span'];
    (index: number, isWhitespace: false, value: string): JSX.IntrinsicElements['span'];
  };
  children?: ReactNode;
  /**
   * When `true`, CSS classes will be rendered.
   */
  cssClasses?: boolean;
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
  onCharCount?: (count: number) => void;
  /**
   * A callback that is called after counting is complete.
   */
  onWordCount?: (count: number) => void;
  /**
   * When `true`, whitespace will be counted while indexing characters.
   */
  whitespace?: boolean;
  /**
   * Customize the properties for each word's element.
   */
  wordProps?: (index: number, value: string) => JSX.IntrinsicElements['span'];
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
  cssVariables = false,
  dataAttributes = false,
  onCharCount,
  onWordCount,
  style,
  whitespace = false,
  ...domProps
}: SplittingProps<T>) => {
  if (by !== CHARS && by !== WORDS) {
    throw new TypeError(`Splitting method must be "${CHARS}" or "${WORDS}"`);
  }

  const {
    charCount,
    children: splittedChildren,
    wordCount,
  } = useMemo(() => {
    const result = splitChildren(children, {
      by,
      cssClasses,
      cssVariables,
      dataAttributes,
      whitespace,
    });
    onCharCount?.(result.charCount);
    onWordCount?.(result.wordCount);
    return result;
  }, [by, children, cssClasses, cssVariables, dataAttributes, whitespace]);

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
                [`--${WORD}-total`]: wordCount,
                [`--${CHAR}-total`]: by === CHARS ? charCount : undefined,
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
  props: Omit<PropsBase, 'children'>,
  count = { chars: 0, words: 0 }
): { charCount: number; children: ReactNode; wordCount: number } => {
  const splittedChildren = Children.map(children, child => {
    if (typeof child === 'bigint' || typeof child === 'boolean' || typeof child === 'number') {
      child = String(child);
    }
    if (typeof child === 'string') {
      const { by, cssClasses, cssVariables, dataAttributes, whitespace } = props;
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
                        [`--${CHAR}-index`]: count.chars - 1, // 0-based
                      }
                    : undefined
                }
                {...props.charProps?.(count.chars - 1, true)}
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
                      [`--${WORD}-index`]: count.words - 1, // 0-based
                    }
                  : undefined
              }
              {...props.wordProps?.(count.words - 1, part)}
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
                                [`--${CHAR}-index`]: count.chars - 1, // 0-based
                              }
                            : undefined
                        }
                        {...props.charProps?.(count.chars - 1, false, char)}
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
