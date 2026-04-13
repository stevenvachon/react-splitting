import { expect, it } from 'vitest';
import * as Index from './index';

it('has named exports', () =>
  ['COLLAPSED_WHITESPACE', 'Segmentation', 'splitting', 'Splitting'].forEach(namedExport =>
    expect(Index).toHaveProperty(namedExport)
  ));
