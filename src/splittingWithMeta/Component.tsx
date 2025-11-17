import type { ComponentsBaseProps, Tags } from '../types';
import splittingWithMeta, { type SplittingWithMetaFunctionProps } from './function';

export type SplittingWithMetaComponentProps<T extends keyof Tags> =
  SplittingWithMetaFunctionProps<T> & ComponentsBaseProps;

/**
 * Split children by words or characters.
 * A re-implementation of splitting.js for React supporting SSR/SSG.
 */
export default <T extends keyof Tags>({ children, ...props }: SplittingWithMetaComponentProps<T>) =>
  splittingWithMeta(children, props).container;
