# Minimize and authorize server/client payloads

Adapted from Vercel's `server-serialization` rule; see
[provenance](../UPSTREAM.md).

Only pass fields needed by the client interaction instead of serializing a
whole domain/database object:

```tsx
return <DisplayName name={authorizedPublicSummary.displayName} />;
```

The example assumes an already-approved server application interface supplies
an authorized projection. Selecting a field for small size is not proof that
it is public. Enforce authorization and ownership on the server before reading
or exposing protected data; hiding it in the UI does not protect it.

Do not send private organization, identity, contact, audit or document fields to
the browser "for later". Never log an actual payload to demonstrate its size;
use synthetic/redacted data. Preserve types and the domain's DTO allowlist.

Measure the HTML/RSC/client payload under equivalent conditions. Do not infer a
specific byte reduction from object property counts. This rule does not approve
a database query, authentication flow, cross-request cache or product endpoint.
