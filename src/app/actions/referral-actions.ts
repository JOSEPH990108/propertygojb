// src\app\actions\referral-actions.ts
'use server';

import { db } from '@/db';
import { user, referralRewards, redemptions } from '@/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { randomBytes } from 'crypto';

// --- HELPERS ---

function generateReferralCode(length = 8): string {
  // Generates uppercase alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Simple in-memory rate limit: IP -> Timestamp
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCountMap = new Map<string, { count: number; expires: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = requestCountMap.get(ip);

    if (!record || now > record.expires) {
        requestCountMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    record.count++;
    return true;
}

// --- ACTIONS ---

export async function verifyReferralCode(code: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    if (!checkRateLimit(ip)) {
        return { valid: false, message: 'Too many requests. Please try again later.' };
    }

    const session = await auth.api.getSession({
        headers: headersList,
    });

    const referrer = await db.query.user.findFirst({
      where: eq(user.referralCode, code),
      columns: { id: true, name: true, referralCode: true },
    });

    if (!referrer) {
      return { valid: false, message: 'Invalid referral code.' };
    }

    if (session && referrer.id === session.user.id) {
       return { valid: false, message: 'You cannot use your own referral code.' };
    }

    return { valid: true, referrerId: referrer.id, referrerName: referrer.name };
  } catch (error) {
    console.error("Verify Referral Code Error:", error);
    return { valid: false, message: 'Error verifying code.' };
  }
}

export async function applyReferralOnSignup(userId: string, referralCode: string) {
    try {
        const referrer = await db.query.user.findFirst({
            where: eq(user.referralCode, referralCode),
        });

        if (!referrer) {
            return { success: false, error: 'Invalid referral code' };
        }

        if (referrer.id === userId) {
             return { success: false, error: 'Self-referral not allowed' };
        }

        // 1. Update User with Referrer
        await db.update(user)
            .set({ referredByUserId: referrer.id })
            .where(eq(user.id, userId));

        // 2. Create Pending Reward
        await db.insert(referralRewards).values({
            referrerId: referrer.id,
            refereeId: userId,
            status: 'PENDING',
            triggerEvent: 'ON_REGISTRATION',
            rewardType: 'CASHBACK', // Default placeholder
        });

        return { success: true };
    } catch (error) {
        console.error("Apply Referral Signup Error:", error);
        return { success: false, error: 'Failed to apply referral' };
    }
}

// Renamed and Enhanced
export async function executeVisitRewards(userId: string, referrerId: string | null | undefined) {
    try {
        // Resolve Effective Referrer:
        // 1. Appointment-specific Referrer (explicit attribution for this campaign/booking).
        // 2. Fallback to User's Account Referrer (global referrer).
        let effectiveReferrerId = referrerId;

        if (!effectiveReferrerId) {
            const userRecord = await db.query.user.findFirst({
                where: eq(user.id, userId),
                columns: { referredByUserId: true }
            });
            effectiveReferrerId = userRecord?.referredByUserId;
        }

        // 1. Validate "First Visit" Identity Constraint
        const existingReward = await db.query.referralRewards.findFirst({
             where: and(
                 eq(referralRewards.refereeId, userId),
                 eq(referralRewards.triggerEvent, 'ON_VISIT')
             )
        });

        if (existingReward) {
             console.log(`User ${userId} already visited. No new reward.`);
             return { success: true, message: 'Already visited' };
        }

        // 2. Issue Referee Reward (Door Gift Voucher) - ALWAYS (even if no referrer?)
        // Requirement: "Referee (Visitor): Receives a 'Door Gift Voucher'... unlocked only after the QR scan."
        // Does this require a referrer? "This incentivizes them to actually show up."
        // Usually yes, even without a referrer, the visitor might get a door gift if it's a "Referral System" feature?
        // But the context is "Appointment Booking Referrals".
        // Let's assume they get it regardless, OR only if referred.
        // "Referral Attribution... capture verbal referrals..."
        // I will assume they need a referrer to unlock the "Referral Reward", otherwise it's just a normal visit.

        if (!effectiveReferrerId) {
             return { success: true, message: 'Visit verified. No referrer linked.' };
        }

        if (effectiveReferrerId === userId) {
            return { success: false, error: 'Self-referral detected.' };
        }

        // 3. Fraud Check: Velocity Limit
        // "If Referrer achieves > 5 successful referrals in 24 hours"
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Assuming simple count check logic, simplified for this snippet
        // We will fetch recent rewards to count.
        const recentRewards = await db.query.referralRewards.findMany({
             where: (rewards, { and, eq, gt }) => and(
                 eq(rewards.referrerId, effectiveReferrerId),
                 eq(rewards.triggerEvent, 'ON_VISIT'),
                 gt(rewards.createdAt, oneDayAgo)
             )
        });

        let status = 'ELIGIBLE';
        if (recentRewards.length >= 5) {
            status = 'MANUAL_REVIEW';
        }

        // 4. Create Referrer Reward (Points/Credits)
        await db.insert(referralRewards).values({
            referrerId: effectiveReferrerId,
            refereeId: userId,
            status: status,
            triggerEvent: 'ON_VISIT',
            rewardType: 'POINTS',
            // amount? schema doesn't have amount in referralRewards, it has `referralTiers` or `walletTransactions`.
            // We just record the event. The actual credit to wallet might happen via a separate trigger or job,
            // or we do it here if status is ELIGIBLE.
        });

        // 5. Create Referee Reward (Voucher)
        // We record this as a reward where the "referrer" is the system? Or just a record.
        // We can reuse referralRewards table or insert into `redemptions`.
        // "Referee ... receives a Door Gift Voucher"
        await db.insert(redemptions).values({
            userId: userId, // The Visitor
            amount: '0.00', // Voucher has no "points" cost maybe? Or face value.
            rewardItem: 'Door Gift Voucher',
            status: 'UNLOCKED',
            code: `VOUCHER-${userId.substring(0,8).toUpperCase()}`,
        });

        return { success: true, status };

    } catch (error) {
        console.error("Execute Visit Rewards Error:", error);
        return { success: false, error: 'Failed to execute rewards' };
    }
}

export async function getReferralStats() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { success: false, error: "Unauthorized" };

    try {
        // Fetch User's Referral Code
        const currentUser = await db.query.user.findFirst({
             where: eq(user.id, session.user.id),
             columns: { referralCode: true }
        });

        let referralCode = currentUser?.referralCode;

        // Auto-generate if missing (should be done on creation, but safety check)
        if (!referralCode) {
            referralCode = generateReferralCode();
            await db.update(user).set({ referralCode }).where(eq(user.id, session.user.id));
        }

        // Count Friends Invited (Referrals)
        const referralsCount = await db
            .select({ count: count() })
            .from(user)
            .where(eq(user.referredByUserId, session.user.id))
            .then(res => res[0].count);

        // Count Rewards Earned (Eligible/Redeemed)
        // Note: For now, we just count 'ELIGIBLE' or 'REDEEMED' rewards?
        // Or should we sum amounts? Requirement says "Rewards Earned" on card.
        // Since we don't have amounts yet, we just return count of rewards.
        const rewardsCount = await db
             .select({ count: count() })
             .from(referralRewards)
             .where(and(
                 eq(referralRewards.referrerId, session.user.id),
                 eq(referralRewards.status, 'ELIGIBLE') // Or REDEEMED
             ))
             .then(res => res[0].count);


        return {
            success: true,
            data: {
                referralCode,
                referralsCount,
                rewardsCount
            }
        };
    } catch (error) {
        console.error("Get Referral Stats Error:", error);
         return { success: false, error: 'Failed to fetch stats' };
    }
}

export async function getReferralHistory() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const history = await db.query.referralRewards.findMany({
            where: eq(referralRewards.referrerId, session.user.id),
            with: {
                referee: {
                    columns: {
                        name: true,
                        image: true,
                        email: true // Optional, maybe hide partial
                    }
                }
            },
            orderBy: [desc(referralRewards.createdAt)]
        });

        return { success: true, data: history };
    } catch (error) {
         console.error("Get Referral History Error:", error);
         return { success: false, error: 'Failed to fetch history' };
    }
}

// Helper to ensure code generation during profile update if missing
export async function ensureReferralCode(userId: string) {
     const currentUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { referralCode: true }
     });

     if (!currentUser?.referralCode) {
         const newCode = generateReferralCode();
         await db.update(user).set({ referralCode: newCode }).where(eq(user.id, userId));
         return newCode;
     }
     return currentUser.referralCode;
}
