# Derive values during rendering

Adapted from Vercel's `rerender-derived-state-no-effect` rule; see
[provenance](../UPSTREAM.md).

If a value is completely determined by current props/state, calculate it
directly instead of keeping a second state variable synchronized with an effect:

```tsx
const fullName = firstName + " " + lastName;
```

This avoids an extra render and drift between source state and derived state.
For expensive computations, establish their cost before considering memoization.

Do not delete effects that synchronize with an external system or perform
necessary cleanup. Distinguish a derived value from a user-editable draft:
resetting a draft on every prop change can destroy unsaved input. If reset or
keyed-remount behavior changes, obtain the product decision and test it.

Preserve loading, empty and error distinctions rather than deriving a
successful-looking fallback from missing data.
