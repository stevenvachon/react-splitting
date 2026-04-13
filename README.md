# react-splitting [![NPM Version][npm-image]][npm-url] ![Build Status][ghactions-image] [![Coverage Status][codecov-image]][codecov-url]

> A re-implementation of [splitting](https://npmjs.com/splitting) (a text segmenter for animation) for React supporting SSR/SSG.

This is a _re_-implementation because the original works with _real_ DOM nodes. Converting `ReactNode`s to such then back again _might_ preserve most--if not all--attributes, but will definitely _lose all_ React event handlers.

> [!CAUTION]
>
> - **Only "chars" and "words"** are supported for the `by` option/property.
> - **No accompanying CSS.** You'll likely want to apply `display: inline-block` to your character and word elements.
> - **No support for `dangerouslySetInnerHTML` or rendered child component content.** [More info](#unsupported-content).

> [!WARNING]
>
> - Script-continuous languages (Japanese, etc) are [properly supported](https://github.com/shshaw/Splitting/issues/112).
> - `<script>` and `<style>` elements are [properly ignored](https://github.com/shshaw/Splitting/issues/111).
> - The `key` option was renamed to `cssKey` to avoid a conflict with React's own [`key` property](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key).
>   - It is [properly prefixed](https://github.com/shshaw/Splitting/issues/110).

> [!NOTE]
>
> - This library comes in two variants: one with "meta" and one without. **The "meta" variant is a drop-in replacement** for the original library as it replicates its CSS classes, CSS variables, `data-*` attributes, lack of proper multilingual support and some quirky whitespace handling.
> - Each variant can be used as a **component**--which offers nothing additional--or as a **function**--which adds segment counts and **access to segment nodes _before_ they're rendered**.

## Consumer Usage

### Installation

```shell
npm install react-splitting
```

### `<Splitting />` / `splitting()`

Lightweight and completely customizable.

```tsx
import { Segmentation, Splitting } from 'react-splitting';

export default () => (
  <>
    <p>
      <Splitting by={Segmentation.WORDS}>
        Text <strong>split</strong> by <em>words</em>.
      </Splitting>
    </p>
    <p>
      <Splitting by={Segmentation.CHARS}>
        Text <strong>split</strong> by <em>characters</em>.
      </Splitting>
    </p>
    With more customization:
    <p>
      <Splitting
        by={Segmentation.WORDS}
        wordProps={i => ({ className: 'word', style: { '--word-index': i } })}
      >
        Text <strong>split</strong> by <em>words</em>.
      </Splitting>
    </p>
    <p>
      <Splitting
        by={Segmentation.CHARS}
        charProps={i => ({ className: 'char', style: { '--char-index': i } })}
        wordProps={i => ({ className: 'word', style: { '--word-index': i } })}
      >
        Text <strong>split</strong> by <em>characters</em>.
      </Splitting>
    </p>
  </>
);
```

```tsx
import { Segmentation, splitting } from 'react-splitting';

export default () => {
  const { charCount, segments, wordCount } = splitting(
    <>
      Text <strong>split</strong> by <em>characters</em>.
    </>,
    {
      by: Segmentation.CHARS,
      charProps: i => ({ className: 'char', style: { '--char-index': i } }),
      wordProps: i => ({ className: 'word', style: { '--word-index': i } }),
    }
  );
  return <p>{segments}</p>;
};
```

### `<SplittingWithMeta />` / `splittingWithMeta()`

Drop-in replacement (except for CSS; mentioned at the top of this document).

```tsx
import { SplittingWithMeta } from 'react-splitting/with-meta';

export default () => (
  <SplittingWithMeta as="div">
    Text with <strong>added metadata</strong>, split by <em>characters</em>.
  </SplittingWithMeta>
);
```

```tsx
import { splittingWithMeta } from 'react-splitting/with-meta';

export default () => {
  const { charCount, container, wordCount } = splittingWithMeta(
    <>
      Text with <strong>added metadata</strong>, split by <em>characters</em>.
    </>,
    { as: 'div' }
  );
  return container;
};
```

### Unsupported Content

As mentioned above, support for `dangerouslySetInnerHTML` and the rendered internals of child components is not possible without a DOM-based pass, such as the original library.

Consider this example:

```tsx
import { type PropsWithChildren, useEffect, useState } from 'react';
import { Segmentation, splitting } from 'react-splitting';

const ChildComponent1 = () => (
  <>
    <em>Child component</em> (1) text.
  </>
);

const ChildComponent2 = ({ children }: PropsWithChildren) => children;

export const MyComponent = () => {
  const [html, setHtml] = useState('Loading content…');

  useEffect(() => {
    fetch('https://api.domain.com')
      .then(res => res.json())
      // Assume API returns `{ rawHtml: '<em>Dynamic</em> text.' }`
      .then(({ rawHtml }) => {
        const temp = document.createElement('div');
        temp.setHTML(rawHtml); // Sanitizes
        return temp.innerHTML;
      })
      .then(setHtml);
  }, []);

  const { segments } = splitting(
    <>
      <em>Static</em> text.
      <span dangerouslySetInnerHTML={{ __html: html }} />
      <ChildComponent1 />
      <ChildComponent2>
        <em>Child component</em> (2) text.
      </ChildComponent2>
    </>,
    { by: Segmentation.CHARS, omitWordElements: true }
  );

  return <p>{segments}</p>;
  /*
    <p>
      <em>
        <span>S</span>
        <span>t</span>
        <span>a</span>
        <span>t</span>
        <span>i</span>
        <span>c</span>
      </em>
      {' '}
      <span>t</span>
      <span>e</span>
      <span>x</span>
      <span>t</span>
      <span>.</span>
      {' '}
      <span><em>Dynamic</em> text.</span>
      <em>Child component</em> (1) text.
      {' '}
      <em>
        <span>C</span>
        <span>h</span>
        <span>i</span>
        <span>l</span>
        <span>d</span>
        {' '}
        <span>c</span>
        <span>o</span>
        <span>m</span>
        <span>p</span>
        <span>o</span>
        <span>n</span>
        <span>e</span>
        <span>n</span>
        <span>t</span>
      </em>
      {' '}
      <span>(</span>
      <span>2</span>
      <span>)</span>
      {' '}
      <span>t</span>
      <span>e</span>
      <span>x</span>
      <span>t</span>
      <span>.</span>
    </p>
  */
};
```

Notice how the contents of `dangerouslySetInnerHTML` and `<ChildComponent1 />` were not split.

**To circumvent the limitation with `dangerouslySetInnerHTML`**, consider using [dom-parser-react](https://npmjs.com/dom-parser-react).

## Development Usage

### Production Build

```shell
npm run build
```

### Testing

The test suite can perform a _single run_:

```shell
npm test
```

… or indefinitely as files are changed:

```shell
npm run test:watch
```

## To Do

- Probably add ESLint/Oxlint/Biome.
- Remove [tsc-alias](https://npmjs.com/tsc-alias) and use `rewriteRelativeImportExtensions` with `allowImportingTsExtensions` [when possible](https://github.com/microsoft/TypeScript/issues/61037).

[npm-image]: https://img.shields.io/npm/v/react-splitting
[npm-url]: https://npmjs.org/react-splitting
[ghactions-image]: https://img.shields.io/github/actions/workflow/status/stevenvachon/react-splitting/test.yml
[codecov-image]: https://img.shields.io/codecov/c/github/stevenvachon/react-splitting
[codecov-url]: https://app.codecov.io/github/stevenvachon/react-splitting
