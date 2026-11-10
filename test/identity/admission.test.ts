import assert from "node:assert/strict";
import {
  createSign,
  generateKeyPairSync,
  randomUUID,
  type KeyObject,
} from "node:crypto";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { createDatabase } from "../../src/db/client";
import { DatabaseError, readDatabaseConfig } from "../../src/db/config";
import { createIdentityAuth } from "../../src/modules/identity/auth-config";

const tenantId = "11111111-1111-4111-8111-111111111111";
const secondTenantId = "22222222-2222-4222-8222-222222222222";
const clientId = "synthetic-client-id";
const contextId = "c1";
const appBaseURL = "http://127.0.0.1:3000/api/auth";
const activeObjectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const disabledObjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const unlinkedObjectId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const signupObjectId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const staleObjectId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const contextObjectId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const signatureObjectId = "99999999-9999-4999-8999-999999999999";

const privateKeyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const wrongKeyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk = {
  ...privateKeyPair.publicKey.export({ format: "jwk" }),
  kid: "synthetic-key",
  alg: "RS256",
  use: "sig",
};

const databaseConfig = readDatabaseConfig();
const adminConfig = readDatabaseConfig(process.env, "bootstrap");
if (databaseConfig.mode !== "test") throw new DatabaseError("DB_TEST_ONLY");
const runtime = createDatabase(databaseConfig);
const admin = createDatabase(adminConfig);

let issuerServer: Server;
let issuer: string;
let auth: ReturnType<typeof createIdentityAuth>;
let scenario = "valid";
const authorizations = new Map<string, { nonce: string; scenario: string }>();

function jsonResponse(
  response: import("node:http").ServerResponse,
  value: unknown,
) {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function issueIdToken(
  nonce: string,
  tokenScenario: string,
  signingKey: KeyObject,
): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const profileTenant =
    tokenScenario === "wrong-tenant" ? secondTenantId : tenantId;
  const authTime =
    tokenScenario === "stale-auth-time" ? nowSeconds - 301 : nowSeconds;
  const acrs =
    tokenScenario === "wrong-context" ? ["unconfigured-context"] : [contextId];
  const audience =
    tokenScenario === "wrong-audience" ? "another-synthetic-client" : clientId;
  const issuerClaim =
    tokenScenario === "wrong-issuer"
      ? `${issuer}/${secondTenantId}/v2.0`
      : `${issuer}/${tenantId}/v2.0`;
  const header = base64url({
    alg: "RS256",
    typ: "JWT",
    kid: "synthetic-key",
  });
  const payload = base64url({
    aud: audience,
    exp: nowSeconds + 600,
    iat: nowSeconds,
    iss: issuerClaim,
    nonce: tokenScenario === "wrong-nonce" ? "replayed-nonce" : nonce,
    sub: `synthetic-subject-${tokenScenario}`,
    tid: profileTenant,
    oid:
      tokenScenario === "wrong-tenant"
        ? activeObjectId
        : objectIdForScenario(tokenScenario),
    auth_time: authTime,
    acrs,
    name: "Synthetic Staff",
  });
  const signedContent = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signedContent);
  signer.end();
  const signature = signer.sign(signingKey).toString("base64url");
  return `${signedContent}.${signature}`;
}

function objectIdForScenario(value: string): string {
  switch (value) {
    case "disabled":
      return disabledObjectId;
    case "unlinked":
      return unlinkedObjectId;
    case "signup":
      return signupObjectId;
    case "stale-auth-time":
      return staleObjectId;
    case "wrong-context":
      return contextObjectId;
    case "bad-signature":
      return signatureObjectId;
    default:
      return activeObjectId;
  }
}

function profileEmail(objectId: string): string {
  return `${tenantId}.${objectId}@identity.invalid`;
}

async function provision(
  id: string,
  objectId: string,
  status: "active" | "disabled" | "unlinked",
): Promise<void> {
  await admin.pool.query(
    `INSERT INTO identity."user" (id, name, email) VALUES ($1, 'Synthetic Staff', $2)`,
    [id, profileEmail(objectId)],
  );
  if (status !== "unlinked") {
    await admin.pool.query(
      `INSERT INTO identity.account (id, account_id, provider_id, user_id)
       VALUES ($1, $2, 'microsoft-entra-id', $3)`,
      [randomUUID(), `${tenantId}:${objectId}`, id],
    );
  }
  await admin.pool.query(
    `INSERT INTO identity.staff_membership
       (user_id, organization_id, role, status, deactivated_at)
     VALUES ($1, $2, 'agent', $3, CASE WHEN $3 = 'disabled' THEN now() END)`,
    [
      id,
      adminConfig.organizationId,
      status === "disabled" ? "disabled" : "active",
    ],
  );
}

function cookieHeader(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";", 1)[0])
    .join("; ");
}

function mergeCookies(...headers: string[]): string {
  const cookies = new Map<string, string>();
  for (const header of headers) {
    for (const cookie of header.split("; ")) {
      const separator = cookie.indexOf("=");
      if (separator > 0) cookies.set(cookie.slice(0, separator), cookie);
    }
  }
  return [...cookies.values()].join("; ");
}

async function signIn(
  tokenScenario: string,
  cookies = "",
): Promise<{ response: Response; cookies: string }> {
  scenario = tokenScenario;
  const start = await auth.handler(
    new Request(`${appBaseURL}/sign-in/social`, {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        provider: "microsoft-entra-id",
        callbackURL: "http://127.0.0.1:3000/finished",
      }),
    }),
  );
  assert.equal(start.status, 200);
  const startCookies = cookieHeader(start);
  const authorizationURL = start.headers.get("location");
  assert.ok(authorizationURL);
  const authorizationResponse = await fetch(authorizationURL, {
    redirect: "manual",
  });
  assert.equal(authorizationResponse.status, 302);
  const callbackURL = authorizationResponse.headers.get("location");
  assert.ok(callbackURL);
  const callback = await auth.handler(
    new Request(callbackURL, {
      headers: { cookie: [cookies, startCookies].filter(Boolean).join("; ") },
    }),
  );
  return { response: callback, cookies: cookieHeader(callback) };
}

before(async () => {
  await new Promise<void>((resolve, reject) => {
    issuerServer = createServer((request, response) => {
      const requestURL = new URL(request.url ?? "/", issuer);
      if (
        requestURL.pathname ===
        `/${tenantId}/v2.0/.well-known/openid-configuration`
      ) {
        jsonResponse(response, {
          issuer: `${issuer}/${tenantId}/v2.0`,
          authorization_endpoint: `${issuer}/${tenantId}/oauth2/v2.0/authorize`,
          token_endpoint: `${issuer}/${tenantId}/oauth2/v2.0/token`,
          userinfo_endpoint: `${issuer}/userinfo`,
          jwks_uri: `${issuer}/${tenantId}/discovery/v2.0/keys`,
          id_token_signing_alg_values_supported: ["RS256"],
        });
        return;
      }
      if (requestURL.pathname === `/${tenantId}/discovery/v2.0/keys`) {
        jsonResponse(response, { keys: [publicJwk] });
        return;
      }
      if (requestURL.pathname === `/${tenantId}/oauth2/v2.0/authorize`) {
        const code = randomUUID();
        const nonce = requestURL.searchParams.get("nonce");
        const state = requestURL.searchParams.get("state");
        const redirectURI = requestURL.searchParams.get("redirect_uri");
        const claims = requestURL.searchParams.get("claims");
        const expectedClaims = JSON.stringify({
          id_token: {
            acrs: { essential: true, values: [contextId] },
          },
        });
        if (!nonce || !state || !redirectURI || claims !== expectedClaims) {
          response.writeHead(400).end();
          return;
        }
        authorizations.set(code, { nonce, scenario });
        const callback = new URL(redirectURI);
        callback.searchParams.set("code", code);
        callback.searchParams.set("state", state);
        response.writeHead(302, { location: callback.toString() }).end();
        return;
      }
      if (requestURL.pathname === `/${tenantId}/oauth2/v2.0/token`) {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk: string) => {
          body += chunk;
        });
        request.on("end", () => {
          const form = new URLSearchParams(body);
          const code = form.get("code") ?? "";
          const authorization = authorizations.get(code);
          if (!authorization) {
            response.writeHead(400).end();
            return;
          }
          authorizations.delete(code);
          const signingKey =
            authorization.scenario === "bad-signature"
              ? wrongKeyPair.privateKey
              : privateKeyPair.privateKey;
          response.writeHead(200, {
            "content-type": "application/json",
          });
          response.end(
            JSON.stringify({
              access_token: "synthetic-access-token",
              token_type: "Bearer",
              expires_in: 3600,
              scope: "openid profile email",
              id_token: issueIdToken(
                authorization.nonce,
                authorization.scenario,
                signingKey,
              ),
            }),
          );
        });
        return;
      }
      response.writeHead(404).end();
    });
    issuerServer.once("error", reject);
    issuerServer.listen(0, "127.0.0.1", () => resolve());
  });
  const address = issuerServer.address();
  if (!address || typeof address === "string") {
    throw new Error("SYNTHETIC_ISSUER_ADDRESS_INVALID");
  }
  issuer = `http://127.0.0.1:${address.port}`;
  auth = createIdentityAuth(runtime.db, {
    baseURL: appBaseURL,
    secret: "synthetic-only-better-auth-test-secret",
    tenantId,
    clientId,
    clientSecret: "synthetic-only-client-secret",
    authority: issuer,
    authenticationContextId: contextId,
  });
  await provision("synthetic-active-user", activeObjectId, "active");
  await provision("synthetic-disabled-user", disabledObjectId, "disabled");
  await provision("synthetic-unlinked-user", unlinkedObjectId, "unlinked");
  await provision("synthetic-stale-user", staleObjectId, "active");
  await provision("synthetic-context-user", contextObjectId, "active");
  await provision("synthetic-signature-user", signatureObjectId, "active");
});

after(async () => {
  await Promise.all([
    runtime.close(),
    admin.close(),
    new Promise<void>((resolve, reject) =>
      issuerServer.close((error) => (error ? reject(error) : resolve())),
    ),
  ]);
});

test("verified Entra-shaped flow admits pre-provisioned identities without email claims", async () => {
  const result = await signIn("valid");
  assert.equal(result.response.status, 302);
  assert.match(result.response.headers.get("location") ?? "", /\/finished/);
  assert.match(result.cookies, /session_token=/);
  const rows = await admin.pool.query<{ email: string; count: string }>(
    `SELECT u.email, count(a.id)::text AS count
     FROM identity."user" u JOIN identity.account a ON a.user_id = u.id
     WHERE u.id = 'synthetic-active-user' GROUP BY u.email`,
  );
  assert.equal(rows.rows[0]?.email, profileEmail(activeObjectId));
  assert.equal(rows.rows[0]?.count, "1");
  const accountTokens = await admin.pool.query<{
    access_token: string | null;
    refresh_token: string | null;
    id_token: string | null;
    access_token_expires_at: Date | null;
    refresh_token_expires_at: Date | null;
    password: string | null;
  }>(
    `SELECT access_token, refresh_token, id_token, access_token_expires_at,
       refresh_token_expires_at, password
     FROM identity.account WHERE user_id = 'synthetic-active-user'`,
  );
  assert.deepEqual(accountTokens.rows, [
    {
      access_token: null,
      refresh_token: null,
      id_token: null,
      access_token_expires_at: null,
      refresh_token_expires_at: null,
      password: null,
    },
  ]);

  const sessionBefore = await admin.pool.query<{
    expires_at: Date;
    updated_at: Date;
    created_at: Date;
  }>(
    `SELECT expires_at, updated_at, created_at FROM identity.session
     WHERE user_id = 'synthetic-active-user'`,
  );
  const sessionResponse = await auth.handler(
    new Request(`${appBaseURL}/get-session`, {
      headers: { cookie: result.cookies },
    }),
  );
  assert.equal(sessionResponse.status, 200);
  assert.doesNotMatch(
    sessionResponse.headers.getSetCookie().join(";"),
    /session_data/i,
  );
  const sessionAfter = await admin.pool.query<{
    expires_at: Date;
    updated_at: Date;
    created_at: Date;
  }>(
    `SELECT expires_at, updated_at, created_at FROM identity.session
     WHERE user_id = 'synthetic-active-user'`,
  );
  assert.equal(
    sessionAfter.rows[0]?.updated_at.toISOString(),
    sessionBefore.rows[0]?.updated_at.toISOString(),
  );
  assert.equal(
    sessionAfter.rows[0]?.expires_at.toISOString(),
    sessionBefore.rows[0]?.expires_at.toISOString(),
  );
  assert.ok(
    Math.abs(
      (sessionBefore.rows[0]!.expires_at.getTime() -
        sessionBefore.rows[0]!.created_at.getTime()) /
        1000 -
        8 * 60 * 60,
    ) < 5,
  );
});

test("disabled memberships deny returning sign-ins without issuing sessions", async () => {
  const result = await signIn("disabled");
  assert.equal(result.cookies.match(/session_token=/), null);
  assert.match(result.response.headers.get("location") ?? "", /error=/);
});

test("missing pre-provisioned accounts cannot sign up or implicitly link by email", async () => {
  const signup = await signIn("signup");
  assert.equal(signup.cookies.match(/session_token=/), null);
  const signupUser = await admin.pool.query(
    `SELECT id FROM identity."user" WHERE id = 'synthetic-signup-user'`,
  );
  assert.equal(signupUser.rowCount, 0);

  const linking = await signIn("unlinked");
  assert.equal(linking.cookies.match(/session_token=/), null);
  const linkedAccount = await admin.pool.query(
    `SELECT id FROM identity.account
     WHERE provider_id = 'microsoft-entra-id' AND account_id = $1`,
    [`${tenantId}:${unlinkedObjectId}`],
  );
  assert.equal(linkedAccount.rowCount, 0);
});

test("provider callback rejects invalid tokens and unqualified authentication claims", async () => {
  for (const name of [
    "bad-signature",
    "wrong-audience",
    "wrong-issuer",
    "wrong-nonce",
    "stale-auth-time",
    "wrong-context",
    "wrong-tenant",
  ]) {
    const result = await signIn(name);
    assert.equal(result.cookies.match(/session_token=/), null, name);
  }
});

test("client-supplied ID tokens cannot sign in or link accounts", async () => {
  const directToken = issueIdToken(
    "client-supplied-nonce",
    "stale-auth-time",
    privateKeyPair.privateKey,
  );
  const directSignIn = await auth.handler(
    new Request(`${appBaseURL}/sign-in/social`, {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        provider: "microsoft-entra-id",
        callbackURL: "http://127.0.0.1:3000/finished",
        idToken: { token: directToken },
      }),
    }),
  );
  assert.equal(directSignIn.status, 404);
  assert.doesNotMatch(
    directSignIn.headers.getSetCookie().join(";"),
    /session_token=/,
  );

  const login = await signIn("valid");
  assert.match(login.cookies, /session_token=/);
  const directLink = await auth.handler(
    new Request(`${appBaseURL}/link-social`, {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
        cookie: login.cookies,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        provider: "microsoft-entra-id",
        idToken: { token: directToken },
      }),
    }),
  );
  assert.equal(directLink.status, 404);
  const linkedAccounts = await admin.pool.query(
    `SELECT id FROM identity.account
     WHERE user_id = 'synthetic-active-user'
       AND provider_id = 'microsoft-entra-id'`,
  );
  assert.equal(linkedAccounts.rowCount, 1);
});

test("explicit account-linking endpoint is disabled for an authenticated staff session", async () => {
  const login = await signIn("valid");
  assert.match(login.cookies, /session_token=/);
  const linkStart = await auth.handler(
    new Request(`${appBaseURL}/link-social`, {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
        cookie: login.cookies,
        "content-type": "application/json",
      },
      body: JSON.stringify({ provider: "microsoft-entra-id" }),
    }),
  );
  assert.equal(linkStart.status, 200);
  const authorizationURL = linkStart.headers.get("location");
  assert.ok(authorizationURL);
  const authorizationResponse = await fetch(authorizationURL, {
    redirect: "manual",
  });
  const callbackURL = authorizationResponse.headers.get("location");
  assert.ok(callbackURL);
  const callback = await auth.handler(
    new Request(callbackURL, {
      headers: {
        cookie: mergeCookies(login.cookies, cookieHeader(linkStart)),
      },
    }),
  );
  const callbackError = new URL(
    callback.headers.get("location") ?? "http://invalid",
  ).searchParams.get("error");
  assert.ok(callbackError);
  assert.notEqual(callbackError, "state_mismatch");
  const linkedAccounts = await admin.pool.query(
    `SELECT id FROM identity.account
     WHERE user_id = 'synthetic-active-user'
       AND provider_id = 'microsoft-entra-id'`,
  );
  assert.equal(linkedAccounts.rowCount, 1);
});
