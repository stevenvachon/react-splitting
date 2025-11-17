import type { ComponentsBaseProps } from '../types';
import splitting, { type SplittingFunctionProps } from './function';

export type SplittingComponentProps = SplittingFunctionProps & ComponentsBaseProps;

/**
 * Split children by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default ({ children, ...props }: SplittingComponentProps) =>
  splitting(children, props).segments;
