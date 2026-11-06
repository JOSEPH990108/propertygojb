# Parallelize independent authorized reads

Adapted from Vercel's `async-parallel` rule; see [provenance](../UPSTREAM.md).

After authorization, start independent reads together rather than waiting for
each round trip in turn:

```ts
const [summary, options] = await Promise.all([
  readAuthorizedSummary(),
  readPublicOptions(),
]);
```

This example assumes both application interfaces already exist and enforce
their required server boundaries. It does not authorize adding them.

Do not start a protected read before its authorization/ownership checks, pass a
client organization identifier as authority, or parallelize an operation that
depends on another result. Keep mutations, transactions, audit writes, rollback
and lock ordering under their domain contract.

Preserve errors: `Promise.all` rejects when a member rejects but does not cancel
the other operations. Do not replace failure with an empty successful-looking
result. Partial-success behavior requires an explicit product decision.

Confirm independence and measure the actual bottleneck; concurrency alone does
not prove a fixed speedup.
