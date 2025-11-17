# react-splitting [![NPM Version][npm-image]][npm-url] ![Build Status][ghactions-image] [![Coverage Status][codecov-image]][codecov-url]

> An (incomplete) re-implementation of [splitting.js](https://npmjs.com/splitting) for React supporting SSR/SSG.

This is a _re_-implementation because the original works with _real_ DOM nodes. Converting `ReactNode`s to such then back again _might_ preserve most--if not all--attributes, but will definitely _lose all_ React event handlers.

> [!WARNING]
>
> - Only "chars" and "words" are supported for the `by` property.
> - `<script>` and `<style>` elements are [property ignored](https://github.com/shshaw/Splitting/issues/111).
> - The `key` option was renamed to `cssKey` to avoid a conflict with React's own [`key` property](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key).
>   - It is [properly prefixed](https://github.com/shshaw/Splitting/issues/110).

> [!NOTE]
>
> - This library comes in two variants: one with "meta" and one without. **The "meta" variant is a drop-in replacement** for the original library as it replicates its CSS classes, CSS variables, `data-*` attributes and some quirky whitespace handling.
> - Each variant can be used as a **component**--which offers nothing additional--or as a **function**--which adds counts for characters & words and **access to data before it's rendered**.

## Consumer Usage

### Installation

```shell
npm install react-splitting
```

### `<Splitting />` / `splitting()`

Lightweight and completely customizable.

```tsx
import { CHARS, Splitting, WORDS } from 'react-splitting';

export default () => (
  <>
    <p>
      <Splitting by={WORDS}>
        Text <strong>split</strong> by <em>words</em>.
      </Splitting>
    </p>
    <p>
      <Splitting by={CHARS}>
        Text <strong>split</strong> by <em>characters</em>.
      </Splitting>
    </p>
    With more customization:
    <p>
      <Splitting by={WORDS} wordProps={i => ({ className: 'word', style: { '--word-index': i } })}>
        Text <strong>split</strong> by <em>words</em>.
      </Splitting>
    </p>
    <p>
      <Splitting
        by={CHARS}
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
import { splitting, WORDS } from 'react-splitting';

export default () => {
  const { charCount, segments, wordCount } = splitting(
    <>
      Text <strong>split</strong> by <em>words</em>.
    </>,
    {
      by: WORDS,
      charProps: i => ({ className: 'char', style: { '--char-index': i } }),
      wordProps: i => ({ className: 'word', style: { '--word-index': i } }),
    }
  );
  return <p>{segments}</p>;
};
```

### `<SplittingWithMeta />` / `splittingWithMeta()`

Drop-in replacement.

```tsx
import { SplittingWithMeta } from 'react-splitting/with-meta';

export default () => (
  <SplittingWithMeta as="div">
    Text with <strong>added metadata</strong>, split by <em>characters</em>.
  </SplittingWithMeta>
);
```

```tsx
import { splittingWithMeta, WORDS } from 'react-splitting/with-meta';

export default () => {
  const { charCount, container, wordCount } = splittingWithMeta(
    <>
      Text <strong>split</strong> by <em>words</em>.
    </>,
    { as: 'div', by: WORDS }
  );
  return container;
};
```

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

- Test with languages that don't use normal whitespace delimiters, such as Japanese, I think. Check out `Intl.Segmenter`'s ["word" `granularity`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter#word).
- Probably add ESLint.
- Remove [tsc-alias](https://npmjs.com/tsc-alias) and use `rewriteRelativeImportExtensions` with `allowImportingTsExtensions` [when possible](https://github.com/microsoft/TypeScript/issues/61037).

[npm-image]: https://img.shields.io/npm/v/react-splitting
[npm-url]: https://npmjs.org/react-splitting
[ghactions-image]: https://img.shields.io/github/actions/workflow/status/stevenvachon/react-splitting/test.yml
[codecov-image]: https://img.shields.io/codecov/c/github/stevenvachon/react-splitting
[codecov-url]: https://app.codecov.io/github/stevenvachon/react-splitting
