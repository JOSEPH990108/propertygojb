# Defer an optional heavy client component

Adapted from Vercel's `bundle-dynamic-imports` rule; see
[provenance](../UPSTREAM.md).

Use existing Next.js facilities to defer an already-approved optional component
when measurements justify it. Do not add an editor, chart library or animation
dependency merely to demonstrate lazy loading.

```tsx
"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";

const DetailPanel = dynamic(() => import("./detail-panel"), {
  loading: () => <p role="status">Loading details...</p>,
});

export function OptionalDetails() {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide details" : "Show details"}
      </button>
      <div id={panelId}>{open ? <DetailPanel /> : null}</div>
    </>
  );
}
```

The example assumes a local default-exported `detail-panel` already exists.
Production labels follow the repository's localization conventions. Its loading
state does not handle a rejected import: retain the application's approved error
boundary and retry/error UX, and test loading and failure as well as success.

Keep primary property content crawlable and server-rendered. Use `ssr: false`
only for a genuinely browser-only optional component, **inside a Client
Component**; it is not allowed in a Server Component. Do not gate the entire
page on mounting or disable SSR to conceal a hydration bug.

Check version-matched Next documentation and compare build/runtime evidence;
an import statement alone does not prove lower initial transfer or better LCP.
