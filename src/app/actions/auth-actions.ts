// src\app\actions\auth-actions.ts
"use server";

import { auth } from "@/lib/auth"; 
import { db } from "@/db"; 
import { user, account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers, cookies } from "next/headers"; // Added cookies
import { applyReferralOnSignup, ensureReferralCode } from "@/app/actions/referral-actions";

export async function verifyPhoneOtp(phoneNumber: string, code: string, rememberMe: boolean) {
    try {
        const h = await headers();
        // 1. Verify and create session (Default behavior: persistent based on config)
        const res = await auth.api.verifyPhoneNumber({
            body: {
                phoneNumber,
                code,
                disableSession: false,
            },
            headers: h
        });

        if (!res || !res.token) {
             return { success: false, error: "Invalid OTP or failed to create session." };
        }

        // 2. Handle "Session Cookie" (Remember Me = false)
        // If rememberMe is false, we want to force it to be a Session Cookie (no Max-Age)
        if (!rememberMe) {
            const cookieStore = await cookies();

            // Try to get the cookie set by better-auth in the same request if possible
            const betterAuthCookie = cookieStore.get("better-auth.session_token");

            // Use the token from the cookie if available (to match any internal formatting), otherwise fallback to res.token
            const tokenToUse = betterAuthCookie?.value || res.token;

            // We explicitly set the cookie to override the default persistent one set by better-auth.
            // We use the default name "better-auth.session_token".
            cookieStore.set({
                name: "better-auth.session_token",
                value: tokenToUse,
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                // Omitting maxAge and expires makes it a Session Cookie
            });
        }

        // 3. Determine if new user (for redirect logic)
        // Check if email is temporary
        const isNewUser = res.user.email?.includes("@temp.propertygo.com");

        return {
            success: true,
            isNewUser: !!isNewUser
        };

    } catch (e: any) {
        // BetterAuth throws APIError
        return { success: false, error: e.message || "Verification failed" };
    }
}

export async function updateProfileAfterSignup(data: { name: string; email?: string; referralCode?: string }) {
  // 1. Get the current session (User is already logged in by the verifyOTP call)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 2. Direct Database Update
    await db.update(user)
      .set({
        name: data.name,
        email: data.email,
        onboardingCompleted: true,
        // We set email directly here because we trust the input from the signup flow
      })
      .where(eq(user.id, session.user.id));

    // 3. Ensure this new user has their OWN referral code generated
    await ensureReferralCode(session.user.id);

    // 4. Apply Referral if provided (Linking them to a referrer)
    if (data.referralCode) {
       await applyReferralOnSignup(session.user.id, data.referralCode);
    }

    return { success: true };
  } catch (error) {
    console.error("Profile Update Failed:", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function getOnboardingStatus() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, completed: false, error: "Unauthorized" };
  }

  try {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { onboardingCompleted: true, name: true, createdAt: true }
    });

    if (!userRecord) return { success: false, completed: false, error: "User not found" };

    const CUTOFF_DATE = new Date("2025-02-18T00:00:00Z");
    const isOldUser = userRecord.createdAt < CUTOFF_DATE;

    return {
      success: true,
      completed: userRecord.onboardingCompleted || isOldUser,
      userName: userRecord.name
    };

  } catch (error) {
    console.error("Get Onboarding Status Error:", error);
    return { success: false, completed: false, error: "System error" };
  }
}

export async function checkUserExists(phoneNumber: string) {
  try {
    // 1. Check if user exists with this phone number
    const existingUser = await db.query.user.findFirst({
      where: eq(user.phoneNumber, phoneNumber),
    });

    if (!existingUser) {
      return { exists: false, verified: false, error: "Phone number not found" };
    }

    // 2. Check if verified
    if (!existingUser.phoneNumberVerified) {
      return { exists: true, verified: false, error: "Phone number not verified" };
    }

    return { exists: true, verified: true };
  } catch (error) {
    console.error("Check User Error:", error);
    return { exists: false, verified: false, error: "System error" };
  }
}

export async function getLinkedAccounts() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Find all accounts for this user
    const accounts = await db.query.account.findMany({
      where: eq(account.userId, session.user.id),
    });

    // Extract provider IDs
    const providers = accounts.map((acc) => acc.providerId);

    return { success: true, providers };
  } catch (error) {
    console.error("Get Linked Accounts Error:", error);
    return { success: false, error: "Failed to fetch accounts" };
  }
}

export async function getAccountMethods() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check linked accounts
    const accounts = await db.query.account.findMany({
      where: eq(account.userId, session.user.id),
    });

    const google = accounts.some((acc) => acc.providerId === "google");
    const hasPassword = accounts.some((acc) => !!acc.password);

    // Check user table for phone
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!userRecord) {
      return { success: false, error: "User not found" };
    }

    const phone = !!(userRecord.phoneNumber && userRecord.phoneNumberVerified);

    return { success: true, methods: { google, hasPassword, phone } };
  } catch (error) {
    console.error("Get Account Methods Error:", error);
    return { success: false, error: "Failed to fetch account methods" };
  }
}

export async function unlinkGoogleAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Check if user has other methods
    const accounts = await db.query.account.findMany({
      where: eq(account.userId, session.user.id),
    });

    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!userRecord) {
      return { success: false, error: "User not found" };
    }

    const hasPassword = accounts.some((acc) => !!acc.password);
    const hasPhone = !!(userRecord.phoneNumber && userRecord.phoneNumberVerified);
    const hasGoogle = accounts.some((acc) => acc.providerId === "google");

    // If no password and no phone, they MUST keep Google
    if (!hasPassword && !hasPhone && hasGoogle) {
      return {
        success: false,
        error: "You cannot disconnect your only login method. Set up a password or verified phone first.",
      };
    }

    // 2. Delete Google account row
    await db.delete(account)
      .where(
          and(
             eq(account.userId, session.user.id),
             eq(account.providerId, "google")
          )
      );

    return { success: true };
  } catch (error) {
    console.error("Unlink Google Error:", error);
    return { success: false, error: "Failed to unlink Google account" };
  }
}

export async function deleteUserAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Delete user (cascade should handle session, accounts, etc.)
    await db.delete(user).where(eq(user.id, session.user.id));
    return { success: true };
  } catch (error) {
    console.error("Delete Account Error:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
