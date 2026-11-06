# Do not memoize trivial primitive expressions

Adapted from Vercel's `rerender-simple-expression-in-memo` rule; see
[provenance](../UPSTREAM.md).

For a cheap calculation with a primitive result, prefer the expression:

```tsx
const isLoading = userLoading || notificationsLoading;
```

Wrapping that expression in `useMemo` adds dependency comparison and complexity
without an established benefit. Correctness must not depend on memoization.

This is not a blanket ban on memoization. Measure genuinely expensive
calculations, consider object identity when it is part of an interaction
contract, and preserve observable behavior. Do not turn missing/error data into
a misleading "loaded" state while simplifying an expression.
