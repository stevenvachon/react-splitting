import { type ReactNode } from 'react';
import split, { type SplitBaseProps } from '../split';

export type SplittingFunctionProps = SplitBaseProps;

/**
 * Split text and elements by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default (input: ReactNode, options?: SplittingFunctionProps) => split(input, options);
