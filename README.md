# react-splitting

> An (incomplete) re-implementation of [splitting.js](https://npmjs.com/splitting) for React supporting SSR/SSG.

This is a _re_-implementation because the original works with _real_ DOM nodes. Converting `ReactNode`s to such then back again _might_ preserve most--if not all--attributes, but will definitely lose _all_ React event handlers.

**Note:** Only "chars" and "words" are supported for the `by` property.

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
    <Splitting by="words">{children}</Splitting>
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
