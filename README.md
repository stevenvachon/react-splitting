# react-splitting [![NPM Version][npm-image]][npm-url] ![Build Status][ghactions-image] [![Coverage Status][codecov-image]][codecov-url]

> An (incomplete) re-implementation of [splitting.js](https://npmjs.com/splitting) for React supporting SSR/SSG.

This is a _re_-implementation because the original works with _real_ DOM nodes. Converting `ReactNode`s to such then back again _might_ preserve most--if not all--attributes, but will definitely _lose all_ React event handlers.

**Notes/Differences:**

- Only "chars" and "words" are supported for the `by` property.
- `<script>` and `<style>` elements are [property ignored](https://github.com/shshaw/Splitting/issues/111).
- The `key` option was renamed to `cssKey` to avoid a conflict with React's own [`key` property](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key).
  - It is [properly prefixed](https://github.com/shshaw/Splitting/issues/110).

## Consumer Usage

### Installation

```shell
npm install react-splitting
```

### `<Splitting />`:

The lightweight, modernized component which can be completely customized.

```tsx
import Splitting, { CHARS, WORDS } from 'react-splitting';

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

### `<SplittingWithMeta />`:

The extended component which adds all of the original metadata to each element, including the container element (`as` prop).

```tsx
import SplittingWithMeta from 'react-splitting/with-meta';

export default () => (
  <SplittingWithMeta as="div" onCharCount={console.log} onWordCount={console.log}>
    Text with <strong>added metadata</strong>, split by <em>characters</em>.
  </SplittingWithMeta>
);
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

- Test with languages that don't use normal whitespace delimiters, if any such exist.
- Probably add ESLint.
- Try using [happy-dom](https://npmjs.com/happy-dom) again. It [didn't support splitting.js](https://github.com/capricorn86/happy-dom/issues/1959).

[npm-image]: https://img.shields.io/npm/v/react-splitting
[npm-url]: https://npmjs.org/react-splitting
[ghactions-image]: https://img.shields.io/github/actions/workflow/status/stevenvachon/react-splitting/test.yml
[codecov-image]: https://img.shields.io/codecov/c/github/stevenvachon/react-splitting
[codecov-url]: https://app.codecov.io/github/stevenvachon/react-splitting
