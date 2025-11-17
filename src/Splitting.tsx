import { CHARS } from './constants';
import splitChildren, { type SplitChildrenProps } from './splitChildren';
import type { SplittingComponentsBaseProps } from './types';
import { useEffect, useRef } from 'react';

export { COLLAPSED_WHITESPACE, WORDS } from './constants';
export { CHARS };

export type SplittingProps = SplitChildrenProps & SplittingComponentsBaseProps;

/**
 * Split children by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default ({ children, onCharCount, onWordCount, ...props }: SplittingProps) => {
  const isFirstRender = useRef(true);
  const { charCount, children: splittedChildren, wordCount } = splitChildren(children, props);

  const callCallbacks = () => {
    if (props.by === CHARS || props.by === undefined) {
      onCharCount?.(charCount);
    }
    onWordCount?.(wordCount);
  };

  // Supports SSR
  if (isFirstRender.current) {
    callCallbacks();
  }

  // Non-SSR
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      callCallbacks();
    }
  }, [charCount, onCharCount, onWordCount, wordCount]);

  return splittedChildren;
};
