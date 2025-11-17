import { expect, it } from 'vitest';
import * as index from './index';

it('has named exports', () =>
  ['COLLAPSED_WHITESPACE', 'Segmentation', 'splittingWithMeta', 'SplittingWithMeta'].forEach(
    namedExport => expect(index).toHaveProperty(namedExport)
  ));
