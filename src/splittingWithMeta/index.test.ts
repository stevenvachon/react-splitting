import { expect, it } from 'vitest';
import * as Index from './index';

it('has named exports', () =>
  ['COLLAPSED_WHITESPACE', 'Segmentation', 'splittingWithMeta', 'SplittingWithMeta'].forEach(
    namedExport => expect(Index).toHaveProperty(namedExport)
  ));
