import { describe, expect, it } from 'vitest';
import { MULTIPLE_WORDS_CHILDREN, renderToHTML } from './testHelpers';
import { type ReactNode } from 'react';
import splitChildren, { CHARS, type SplitChildrenProps, WORDS } from './splitChildren';

const COMMON_CHARS_RESULT = (
  <>
    <span>
      <span>t</span>
      <span>e</span>
      <span>x</span>
      <span>t</span>
      <span>1</span>
    </span>
    <span> </span>
    <span>
      <span>t</span>
      <span>e</span>
      <span>x</span>
      <span>t</span>
      <span>2</span>
    </span>
  </>
);

const COMMON_WORDS_RESULT = (
  <>
    <span>text1</span>
    <span> </span>
    <span>text2</span>
  </>
);

const test = async (props: SplitChildrenProps, result: ReactNode) =>
  expect(renderToHTML(splitChildren(MULTIPLE_WORDS_CHILDREN, props).children)).resolves.toBe(
    await renderToHTML(result)
  );

// Most of `splitChildren`'s  behavior is covered by `Splitting`'s and `SplittingWithMeta`'s tests

describe('charProps', () => {
  it('supports an undefined return value', async () => {
    await test({ by: CHARS, charProps: () => undefined }, COMMON_CHARS_RESULT);
    await test({ by: WORDS, charProps: () => undefined }, COMMON_WORDS_RESULT);
  });
});

describe('content', () => {
  it('supports an undefined return value', async () => {
    await test(
      { by: CHARS, content: () => undefined },
      <>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span></span>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </>
    );
    await test(
      { by: WORDS, content: () => undefined },
      <>
        <span></span>
        <span></span>
        <span></span>
      </>
    );
  });
});

describe('wordProps', () => {
  it('supports an undefined return value', async () => {
    await test({ by: CHARS, wordProps: () => undefined }, COMMON_CHARS_RESULT);
    await test({ by: WORDS, wordProps: () => undefined }, COMMON_WORDS_RESULT);
  });
});
