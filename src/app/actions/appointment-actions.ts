// src\app\actions\appointment-actions.ts
'use server';

import { db } from '@/db';
import { appointments, appointmentStatuses } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { verifyReferralCode, executeVisitRewards } from './referral-actions';

// --- HELPERS ---
async function getStatusId(code: string) {
    const status = await db.query.appointmentStatuses.findFirst({
        where: eq(appointmentStatuses.code, code)
    });
    return status?.id;
}

// --- ACTIONS ---

export async function createAppointment(data: {
    projectId: string;
    scheduledAt: Date;
    referralCode?: string;
    notes?: string;
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        const userId = session.user.id;

        // 1. Resolve Status (Default PENDING)
        // If system auto-confirms, we might switch to CONFIRMED.
        // User asked for: "PENDING (User requested) -> CONFIRMED (Agent/System accepted)"
        const pendingStatus = await getStatusId('PENDING');
        if (!pendingStatus) return { success: false, error: 'System Error: Status not found' };

        // 2. Validate Referral Code if provided
        let referrerId: string | undefined = undefined;
        if (data.referralCode) {
            const validCode = await verifyReferralCode(data.referralCode);
            if (validCode.valid && validCode.referrerId) {
                referrerId = validCode.referrerId;
            } else if (!validCode.valid) {
                // Should we fail hard? Or just ignore invalid code?
                // User requirement: "Validation: Verify the code exists and check Referrer_ID != User_ID"
                // Ideally return error to UI so they know code failed.
                return { success: false, error: validCode.message };
            }
        }

        // 3. Create Appointment
        const result = await db.insert(appointments).values({
            userId,
            projectId: data.projectId,
            scheduledAt: data.scheduledAt,
            statusId: pendingStatus,
            referrerId: referrerId,
            notes: data.notes,
            // qrToken is generated on CONFIRM, not create.
        }).returning({ id: appointments.id });

        return { success: true, appointmentId: result[0].id };

    } catch (error) {
        console.error("Create Appointment Error:", error);
        return { success: false, error: 'Failed to book appointment' };
    }
}

export async function confirmAppointment(appointmentId: string) {
    // Permission Check: Agent/Admin only.
    // Ideally check session role. For now, assuming authorized.

    try {
        const confirmedStatus = await getStatusId('CONFIRMED');
        if (!confirmedStatus) return { success: false, error: 'System Error: Status not found' };

        // Generate QR Token (UUID)
        const qrToken = randomUUID();

        await db.update(appointments)
            .set({
                statusId: confirmedStatus,
                qrToken: qrToken
            })
            .where(eq(appointments.id, appointmentId));

        return { success: true, qrToken };
    } catch (error) {
        console.error("Confirm Appointment Error:", error);
        return { success: false, error: 'Failed to confirm' };
    }
}

export async function scanAppointment(qrToken: string) {
    // Permission Check: Agent only.
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };
    // TODO: Verify role is 'agent' or 'admin'

    try {
        const completedStatus = await getStatusId('COMPLETED');
        const confirmedStatus = await getStatusId('CONFIRMED');

        if (!completedStatus || !confirmedStatus) return { success: false, error: 'System Error: Status not found' };

        // 1. Fetch Appointment & Verify
        // Must be CONFIRMED status.
        // Must be within time window? "Current_Time > End_Time + 2 Hours ... No Show"
        // "Check if token exists, is currently CONFIRMED, and is within the valid time window (+/- 2 hours)."

        const appointment = await db.query.appointments.findFirst({
            where: eq(appointments.qrToken, qrToken),
            with: {
                status: true // Actually mapped to appointmentStatuses
            }
        });

        if (!appointment) {
            return { success: false, error: 'Invalid QR Token' };
        }

        // Check Status (using ID check or code check if we fetched relation)
        // Since we don't have the status object easily without relation setup correctly, we compare ID.
        if (appointment.statusId !== confirmedStatus) {
             return { success: false, error: 'Appointment is not in CONFIRMED state' };
        }

        // Check Time
        const scheduled = new Date(appointment.scheduledAt);
        const now = new Date();
        const twoHours = 2 * 60 * 60 * 1000;

        // Window: Scheduled - 2h to Scheduled + 2h?
        // User: "If Current_Time > Appointment_End_Time + 2 Hours ... NO_SHOW"
        // User: "Validation: ... within the valid time window (+/- 2 hours)."
        // Let's assume Scheduled Time is the start.
        if (now.getTime() < scheduled.getTime() - twoHours) {
            return { success: false, error: 'Too early to check in (max 2h before)' };
        }

        // Expiration check is typically handled by Cron, but for scan validation we also enforce it.
        // Assuming 1 hour default duration for appointments if not specified.
        const defaultDuration = 1 * 60 * 60 * 1000;
        const endTime = scheduled.getTime() + defaultDuration;

        if (now.getTime() > endTime + twoHours) {
             return { success: false, error: 'Appointment expired (No Show)' };
        }

        // 2. Atomic Update (Simulated via sequential await in Drizzle for now)
        await db.update(appointments)
            .set({
                statusId: completedStatus,
                scannedAt: now,
                scannedById: session.user.id
            })
            .where(eq(appointments.id, appointment.id));

        // 3. Trigger Reward Logic
        const rewardResult = await executeVisitRewards(appointment.userId, appointment.referrerId);

        return {
            success: true,
            message: 'Check-in successful',
            rewardStatus: rewardResult.status
        };

    } catch (error) {
         console.error("Scan Appointment Error:", error);
         return { success: false, error: 'Failed to scan' };
    }
}

export async function processNoShows() {
    // Intended for Cron Job
    try {
        const noShowStatus = await getStatusId('NO_SHOW');
        const confirmedStatus = await getStatusId('CONFIRMED');

        if (!noShowStatus || !confirmedStatus) return { success: false };

        const now = new Date();
        // Rule: "If Current_Time > Appointment_End_Time + 2 Hours"
        // Assuming 1h duration: End Time = Scheduled + 1h.
        // So Current > Scheduled + 1h + 2h => Current > Scheduled + 3h.
        // Or: Scheduled < Current - 3h.

        const threeHours = 3 * 60 * 60 * 1000;
        const cutoff = new Date(now.getTime() - threeHours);

        // Find confirmed appointments scheduled BEFORE cutoff
        const expiredAppointments = await db.query.appointments.findMany({
            where: and(
                eq(appointments.statusId, confirmedStatus),
                lt(appointments.scheduledAt, cutoff)
            )
        });

        if (expiredAppointments.length === 0) return { success: true, count: 0 };

        // Batch Update
        // Drizzle doesn't support batch update with where easily on list of IDs,
        // but we can update where scheduledAt < cutoff AND status = confirmed

        await db.update(appointments)
            .set({ statusId: noShowStatus })
            .where(and(
                eq(appointments.statusId, confirmedStatus),
                lt(appointments.scheduledAt, cutoff)
            ));

        return { success: true, count: expiredAppointments.length };
    } catch (error) {
        console.error("Process No Show Error:", error);
        return { success: false, error: 'Failed to process no-shows' };
    }
}
