import { expect, it } from 'vitest';
import * as index from './index';

it('has named exports', () =>
  ['CHARS', 'COLLAPSED_WHITESPACE', 'splittingWithMeta', 'SplittingWithMeta', 'WORDS'].forEach(
    namedExport => expect(index).toHaveProperty(namedExport)
  ));
