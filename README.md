# react-splitting [![NPM Version][npm-image]][npm-url] ![Build Status][ghactions-image] [![Coverage Status][codecov-image]][codecov-url]

> An (incomplete) re-implementation of [splitting.js](https://npmjs.com/splitting) for React supporting SSR/SSG.

This is a _re_-implementation because the original works with _real_ DOM nodes. Converting `ReactNode`s to such then back again _might_ preserve most--if not all--attributes, but will definitely _lose all_ React event handlers.

**Notes:**

- Only "chars" and "words" are supported for the `by` property.
- The `key` option was renamed to `cssKey` to avoid a conflict with React's own [`key` property](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key).

## Consumer Usage

To import into your code:

```shell
npm install react-splitting
```

```tsx
import { type ReactNode } from 'react';
import Splitting from 'react-splitting';

export default ({ children }: { children: ReactNode }) => (
  <Splitting by="words">
    <em>All</em> of this <strong>will be split</strong>, including {children}
  </Splitting>
);
```

To more closely simulate the resulting metadata of the original library:

```tsx
import clsx from 'clsx';
import { type ComponentProps, useMemo, useState } from 'react';
import Splitting, { CHARS, type SplittingProps } from 'react-splitting';

export interface MyComponentProps extends ComponentProps<'div'>, Pick<SplittingProps, 'by'> {}

export default ({ by = CHARS, children, className, style, ...props }: MyComponentProps) => {
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const splitChildren = useMemo(
    () => (
      <Splitting
        by={by}
        cssClasses
        cssVariables
        dataAttributes
        onCount={(w, c) => {
          setCharCount(c);
          setWordCount(w);
        }}
      >
        {children}
      </Splitting>
    ),
    [by, children]
  );

  return (
    <div
      className={clsx({ chars: by === CHARS }, 'words', 'splitting', className)}
      style={{
        '--char-count': by === CHARS ? charCount : undefined,
        '--word-count': wordCount,
        ...style,
      }}
      {...props}
    >
      {splitChildren}
    </div>
  );
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

- Try using [happy-dom](https://npmjs.com/happy-dom) again. It [didn't support splitting.js](https://github.com/capricorn86/happy-dom/issues/1959).

[npm-image]: https://img.shields.io/npm/v/react-splitting
[npm-url]: https://npmjs.org/react-splitting
[ghactions-image]: https://img.shields.io/github/actions/workflow/status/stevenvachon/react-splitting/test.yml
[codecov-image]: https://img.shields.io/codecov/c/github/stevenvachon/react-splitting
[codecov-url]: https://app.codecov.io/github/stevenvachon/react-splitting
