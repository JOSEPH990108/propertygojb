import assert from "node:assert/strict";
import test from "node:test";
import {
  identitySessionPolicy,
  isQualifyingStepUp,
} from "../../src/modules/identity/auth-config";

const now = Date.parse("2026-01-01T00:00:00.000Z");
const contextId = "c1";

test("step-up requires the configured authentication context and fresh auth_time", () => {
  assert.equal(
    isQualifyingStepUp(
      { acrs: [contextId], auth_time: now / 1000 - 300 },
      contextId,
      now,
    ),
    true,
  );
  assert.equal(
    isQualifyingStepUp(
      { acrs: [contextId], auth_time: now / 1000 - 301 },
      contextId,
      now,
    ),
    false,
  );
  assert.equal(
    isQualifyingStepUp(
      { acrs: ["other"], auth_time: now / 1000 },
      contextId,
      now,
    ),
    false,
  );
  assert.equal(
    isQualifyingStepUp({ acrs: [contextId] }, contextId, now),
    false,
  );
  assert.equal(
    isQualifyingStepUp(
      { acrs: [contextId], auth_time: now / 1000 + 31 },
      contextId,
      now,
    ),
    false,
  );
  assert.equal(
    isQualifyingStepUp(
      { acrs: contextId, auth_time: now / 1000 },
      contextId,
      now,
    ),
    false,
  );
});

test("session policy declares the configured absolute and idle limits", () => {
  assert.deepEqual(identitySessionPolicy, {
    cookieCacheEnabled: false,
    disableSessionRefresh: true,
    idleTimeoutSeconds: 30 * 60,
    privilegedAuthenticationAgeSeconds: 5 * 60,
    sessionLifetimeSeconds: 8 * 60 * 60,
    updateAgeSeconds: 0,
  });
});
