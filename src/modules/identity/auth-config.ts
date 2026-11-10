import "server-only";
import { betterAuth } from "better-auth";
import {
  genericOAuth,
  microsoftEntraId,
} from "better-auth/plugins/generic-oauth";
import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { OAuth2Tokens } from "better-auth/oauth2";
import * as schema from "../../db/schema";
import {
  errorCode as databaseErrorCode,
  readDatabaseConfig,
} from "../../db/config";
import { createIdentityAdapter } from "./adapter";
import { account, staffMembership, user } from "./schema";

const microsoftTenantPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const entraObjectPattern = microsoftTenantPattern;
const IDLE_TIMEOUT_SECONDS = 30 * 60;
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;
const PRIVILEGED_AUTHENTICATION_AGE_SECONDS = 5 * 60;
const AUTHENTICATION_CLOCK_SKEW_SECONDS = 30;

export interface IdentityAuthOptions {
  baseURL: string;
  secret: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  authority: string;
  authenticationContextId: string;
  now?: () => number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readVerifiedClaims(
  tokens: OAuth2Tokens,
): Record<string, unknown> | null {
  // genericOAuth calls this only after discovery-based signature, issuer, audience, and nonce checks.
  const payload = tokens.idToken?.split(".")[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return isRecord(claims) ? claims : null;
  } catch {
    return null;
  }
}

export function isQualifyingStepUp(
  profile: Record<string, unknown>,
  authenticationContextId: string,
  now: number,
): boolean {
  const authenticationTime = profile.auth_time;
  const authenticationContexts = profile.acrs;
  if (
    !Array.isArray(authenticationContexts) ||
    !authenticationContexts.includes(authenticationContextId) ||
    typeof authenticationTime !== "number" ||
    !Number.isSafeInteger(authenticationTime)
  ) {
    return false;
  }
  const ageSeconds = now / 1000 - authenticationTime;
  return (
    ageSeconds >= -AUTHENTICATION_CLOCK_SKEW_SECONDS &&
    ageSeconds <= PRIVILEGED_AUTHENTICATION_AGE_SECONDS
  );
}

function createMicrosoftEntraConfig(options: IdentityAuthOptions) {
  const tenantId = options.tenantId.toLowerCase();
  if (!microsoftTenantPattern.test(tenantId)) {
    throw new Error("IDENTITY_TENANT_ID_INVALID");
  }
  const authority = new URL(options.authority);
  const originOnly =
    authority.pathname === "/" &&
    !authority.search &&
    !authority.hash &&
    !authority.username &&
    !authority.password;
  const loopbackAuthority =
    authority.protocol === "http:" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(authority.hostname) &&
    originOnly &&
    process.env.NODE_ENV !== "production";
  if (!loopbackAuthority) {
    throw new Error("IDENTITY_SYNTHETIC_AUTHORITY_REQUIRED");
  }
  const authorityURL = authority.toString().replace(/\/$/, "");
  const provider = microsoftEntraId({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    tenantId,
    disableSignUp: true,
    disableImplicitSignUp: true,
    scopes: ["openid", "profile", "email"],
  });

  return {
    ...provider,
    discoveryUrl: `${authorityURL}/${tenantId}/v2.0/.well-known/openid-configuration`,
    authorizationUrl: `${authorityURL}/${tenantId}/oauth2/v2.0/authorize`,
    tokenUrl: `${authorityURL}/${tenantId}/oauth2/v2.0/token`,
    requireIdTokenVerification: true,
    authorizationUrlParams: {
      claims: JSON.stringify({
        id_token: {
          acrs: { essential: true, values: [options.authenticationContextId] },
        },
      }),
    },
    accountSubject: ({
      profile,
    }: {
      profile: Record<string, unknown>;
    }): string => {
      const profileTenant =
        typeof profile.tid === "string" ? profile.tid.toLowerCase() : "";
      const objectId = profile.oid;
      if (
        profileTenant !== tenantId ||
        typeof objectId !== "string" ||
        !entraObjectPattern.test(objectId)
      ) {
        throw new Error("IDENTITY_PROVIDER_SUBJECT_INVALID");
      }
      return `${tenantId}:${objectId.toLowerCase()}`;
    },
    getUserInfo: async (tokens: OAuth2Tokens) => {
      const claims = readVerifiedClaims(tokens);
      if (
        !claims ||
        typeof claims.tid !== "string" ||
        claims.tid.toLowerCase() !== tenantId ||
        typeof claims.oid !== "string" ||
        !entraObjectPattern.test(claims.oid) ||
        !isQualifyingStepUp(
          claims,
          options.authenticationContextId,
          (options.now ?? Date.now)(),
        )
      ) {
        return null;
      }
      return {
        ...claims,
        id: typeof claims.sub === "string" ? claims.sub : undefined,
        email:
          typeof claims.email === "string"
            ? claims.email
            : `${tenantId}.${claims.oid.toLowerCase()}@identity.invalid`,
        emailVerified: claims.email_verified === true,
        name: typeof claims.name === "string" ? claims.name : "Staff",
      };
    },
    mapProfileToUser(profile: Record<string, unknown>) {
      const profileTenant =
        typeof profile.tid === "string" ? profile.tid.toLowerCase() : "";
      const objectId =
        typeof profile.oid === "string" ? profile.oid.toLowerCase() : "";
      if (profileTenant !== tenantId || !entraObjectPattern.test(objectId)) {
        return {};
      }
      return {
        email: `${tenantId}.${objectId}@identity.invalid`,
        emailVerified: false,
        name: typeof profile.name === "string" ? profile.name : "Staff",
      };
    },
  };
}

export function createIdentityAuth(
  db: NodePgDatabase<typeof schema>,
  options: IdentityAuthOptions,
) {
  if (
    !options.clientId ||
    !options.clientSecret ||
    !options.secret ||
    !options.authenticationContextId
  ) {
    throw new Error("IDENTITY_AUTH_CONFIGURATION_REQUIRED");
  }
  const entra = createMicrosoftEntraConfig(options);

  return betterAuth({
    appName: "PropertyGOJB",
    baseURL: options.baseURL,
    secret: options.secret,
    database: createIdentityAdapter(db),
    plugins: [
      genericOAuth({ config: [entra] }),
      {
        id: "staff-id-token-sign-in-guard",
        init(ctx) {
          let providerFound = false;
          const socialProviders = ctx.socialProviders.map((provider) => {
            if (provider.id !== "microsoft-entra-id") return provider;
            providerFound = true;
            return {
              ...provider,
              options: {
                ...provider.options,
                disableIdTokenSignIn: true,
              },
            };
          });
          if (!providerFound) {
            throw new Error("IDENTITY_PROVIDER_CONFIGURATION_REQUIRED");
          }
          return { context: { socialProviders } };
        },
      },
    ],
    emailAndPassword: { enabled: false },
    account: {
      accountLinking: {
        enabled: false,
        disableImplicitLinking: true,
        allowDifferentEmails: false,
      },
      updateAccountOnSignIn: false,
    },
    session: {
      expiresIn: identitySessionPolicy.sessionLifetimeSeconds,
      updateAge: identitySessionPolicy.updateAgeSeconds,
      disableSessionRefresh: identitySessionPolicy.disableSessionRefresh,
      cookieCache: { enabled: identitySessionPolicy.cookieCacheEnabled },
    },
    user: {
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
      validateUserInfo: async ({ user: authUser, source }) => {
        if (
          source.action !== "sign-in" ||
          source.method !== "oauth" ||
          source.oauth?.providerId !== "microsoft-entra-id" ||
          typeof authUser.id !== "string" ||
          !source.oauth.profile
        ) {
          return { error: "staff_sign_in_denied" };
        }

        const profile = source.oauth.profile;
        const profileTenant =
          typeof profile.tid === "string" ? profile.tid.toLowerCase() : "";
        const objectId =
          typeof profile.oid === "string" ? profile.oid.toLowerCase() : "";
        if (
          profileTenant !== options.tenantId.toLowerCase() ||
          !entraObjectPattern.test(objectId)
        ) {
          return { error: "staff_sign_in_denied" };
        }

        try {
          const organizationId = readDatabaseConfig().organizationId;
          const [identity] = await db
            .select({ id: user.id })
            .from(user)
            .innerJoin(
              account,
              and(
                eq(account.userId, user.id),
                eq(account.providerId, source.oauth.providerId),
                eq(account.accountId, `${profileTenant}:${objectId}`),
              ),
            )
            .innerJoin(
              staffMembership,
              and(
                eq(staffMembership.userId, user.id),
                eq(staffMembership.organizationId, organizationId),
                eq(staffMembership.status, "active"),
                inArray(staffMembership.role, ["admin", "agent"]),
              ),
            )
            .where(and(eq(user.id, authUser.id), eq(user.status, "active")))
            .limit(1);
          if (!identity) {
            return { error: "staff_sign_in_denied" };
          }
        } catch (error) {
          console.error(`[identity:admission] ${databaseErrorCode(error)}`);
          return { error: "staff_sign_in_denied" };
        }
      },
    },
  });
}

export type IdentityAuth = ReturnType<typeof createIdentityAuth>;

export async function resolveIdentitySession(
  auth: IdentityAuth,
  headers: Headers,
): Promise<{ id: string; userId: string } | null> {
  const resolved = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (!resolved) return null;
  if (
    typeof resolved.session.id !== "string" ||
    typeof resolved.session.userId !== "string"
  ) {
    throw new Error("IDENTITY_SESSION_INVALID");
  }
  return { id: resolved.session.id, userId: resolved.session.userId };
}

export const identitySessionPolicy = Object.freeze({
  cookieCacheEnabled: false,
  disableSessionRefresh: true,
  idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS,
  privilegedAuthenticationAgeSeconds: PRIVILEGED_AUTHENTICATION_AGE_SECONDS,
  sessionLifetimeSeconds: SESSION_LIFETIME_SECONDS,
  updateAgeSeconds: 0,
});
