import { expect, it } from 'vitest';
import * as index from './index';

it('has named exports', () =>
  ['COLLAPSED_WHITESPACE', 'Segmentation', 'splitting', 'Splitting'].forEach(namedExport =>
    expect(index).toHaveProperty(namedExport)
  ));
