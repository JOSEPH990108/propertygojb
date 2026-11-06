# Use functional updates for previous-state changes

Adapted from Vercel's `rerender-functional-setstate` rule; see
[provenance](../UPSTREAM.md).

When the new value depends on the previous state, use the functional updater:

```tsx
setItems((current) => [...current, newItem]);
setItems((current) => current.filter((item) => item.id !== removedId));
```

This avoids reading a stale captured state value and composes correctly with
queued updates. Keep updater functions pure: no API calls, mutation of existing
objects, logging of private data or audit writes inside an updater.

Direct updates are appropriate when the value is independent of previous state:

```tsx
setName(nextName);
setOpen(false);
```

A functional update does not make every callback stable or justify omitting
other reactive dependencies. Use `useCallback` only for a demonstrated need;
retain Hooks linting and include any other values it captures. Test rapid and
async updates where a stale closure was the issue.
