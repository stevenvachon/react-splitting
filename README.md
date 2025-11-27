# react-splitting

> An (incomplete) re-implementation of [splitting.js](https://npmjs.com/splitting) for React supporting SSR/SSG.

This is a _re_-implementation because the original works with _real_ DOM nodes. Converting `ReactNode`s to such then back again _might_ preserve most--if not all--attributes, but will definitely _lose all_ React event handlers.

**Notes:**

- Only "chars" and "words" are supported for the `by` property.
- `key` option was renamed to `cssKey` to avoid conflicts with React's own [`key` property](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key).

## Consumer Usage

To import into your code:

```shell
npm install react-splitting
```

```tsx
import { type ComponentProps } from 'react';
import Splitting from 'react-splitting';

export default ({ children, ...props }: ComponentProps<'div'>) => (
  <div {...props}>
    <Splitting by="words">
      <em>All</em> of this <strong>will be split</strong>. {children}
    </Splitting>
  </div>
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

- Add coverage.
- Try using [happy-dom](https://npmjs.com/happy-dom) again. It [didn't support splitting.js](https://github.com/capricorn86/happy-dom/issues/1959).
