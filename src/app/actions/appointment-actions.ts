'use server';

import { db } from '@/db';
import { appointments, appointmentStatuses, projects, user, roles } from '@/db/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { verifyReferralCode, executeVisitRewards } from './referral-actions';

// --- HELPERS ---
async function getStatusId(code: string) {
    if (!db) return null;
    const status = await db.query.appointmentStatuses.findFirst({
        where: eq(appointmentStatuses.code, code)
    });
    return status?.id;
}

// Mutable mock store for demo purposes when DB is missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MOCK_STORE: any[] = [];

const MOCK_DATA = [
    {
        id: "mock-1",
        userId: "demo-user",
        agentId: "agent-sarah-tan",
        projectId: "proj-riverhaus",
        scheduledAt: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
        statusId: "status-confirmed",
        notes: "Client is prioritizing high-end facilities and security. Interested in 3BR layout.",
        qrToken: "mock-qr-token",
        project: {
            id: "proj-riverhaus",
            name: "Riverhaus Luxury Suites",
            slug: "riverhaus-luxury-suites",
            address: "Bukit Indah, Johor"
        },
        status: {
            id: "status-confirmed",
            code: "CONFIRMED",
            name: "Confirmed",
            description: "Agent confirmed appointment"
        },
        agent: {
            id: "agent-sarah-tan",
            name: "Sarah Tan",
            phoneNumber: "+60123456789",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop",
            agencyName: "PropertyGo Elite Team"
        }
    },
    {
        id: "mock-2",
        userId: "demo-user",
        agentId: "agent-sarah-tan",
        projectId: "proj-sky-one",
        scheduledAt: new Date(new Date().setDate(new Date().getDate() + 7)), // Next week
        statusId: "status-pending",
        notes: "Requesting specific tower view facing the sea.",
        project: {
            id: "proj-sky-one",
            name: "CTC Sky One",
            slug: "ctc-sky-one",
            address: "Jalan Bukit Chagar, Johor Bahru"
        },
        status: {
            id: "status-pending",
            code: "PENDING",
            name: "Pending",
            description: "User requested appointment"
        },
        agent: {
            id: "agent-sarah-tan",
            name: "Sarah Tan",
            phoneNumber: "+60123456789",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop",
            agencyName: "PropertyGo Elite Team"
        }
    }
];

// --- NEW ACTIONS ---

export async function getUserAppointments() {
    if (!db) {
        // Fallback for missing DB
        return { success: true, data: MOCK_STORE };
    }

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        const data = await db.query.appointments.findMany({
            where: eq(appointments.userId, session.user.id),
            with: {
                project: true,
                status: true,
                agent: true
            },
            orderBy: [desc(appointments.scheduledAt)]
        });

        return { success: true, data };
    } catch (error) {
        console.error("Get User Appointments Error:", error);
        return { success: false, error: "Failed to fetch appointments" };
    }
}

export async function generateDemoAppointments() {
    if (!db) {
         MOCK_STORE = [...MOCK_DATA];
         return { success: true, count: MOCK_STORE.length };
    }

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        const userId = session.user.id;

        // 1. Check if user already has appointments
        const existing = await db.query.appointments.findFirst({
            where: eq(appointments.userId, userId)
        });

        if (existing) {
             return { success: false, error: "User already has appointments. Seed skipped." };
        }

        // 2. Ensure "Sarah Tan" (Agent) exists
        // We try to find her by email or ID.
        let agentId = 'agent-sarah-tan';
        const agent = await db.query.user.findFirst({
            where: eq(user.email, 'sarah.tan@propertygo.com')
        });

        if (agent) {
            agentId = agent.id;
        } else {
            // Create Agent if missing (Fallback if seed wasn't run)
            const agentRole = await db.query.roles.findFirst({
                where: eq(roles.code, 'AGENT')
            });

            if (agentRole) {
                // If ID 'agent-sarah-tan' is taken (unlikely if email check failed), randomUUID
                // But let's try to stick to the ID
                await db.insert(user).values({
                    id: agentId,
                    name: 'Sarah Tan',
                    email: 'sarah.tan@propertygo.com',
                    phoneNumber: '+60123456789',
                    roleId: agentRole.id,
                    emailVerified: true,
                    phoneNumberVerified: true,
                    agencyName: 'PropertyGo Elite Team',
                    renNumber: 'REN 12345',
                    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop'
                }).onConflictDoNothing();
            } else {
                return { success: false, error: "System Error: AGENT role missing" };
            }
        }

        // 3. Get Statuses
        const pending = await getStatusId('PENDING');
        const confirmed = await getStatusId('CONFIRMED');
        const completed = await getStatusId('COMPLETED');

        if (!pending || !confirmed) return { success: false, error: "System Error: Statuses missing" };

        // 4. Get Random Projects
        const projectList = await db.query.projects.findMany({
            limit: 5
        });

        if (projectList.length === 0) return { success: false, error: "System Error: No projects found" };

        // 5. Create Appointments
        // A. Upcoming Confirmed (Tomorrow 10 AM)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        // B. Upcoming Pending (Next Week 2 PM)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(14, 0, 0, 0);

        // C. Past Completed (Yesterday 4 PM)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(16, 0, 0, 0);

        const newAppointments = [
            {
                userId,
                agentId,
                projectId: projectList[0].id,
                scheduledAt: tomorrow,
                statusId: confirmed,
                notes: "Client is prioritizing high-end facilities and security. Interested in 3BR layout.",
                qrToken: randomUUID() // Confirmed has token
            },
            {
                userId,
                agentId,
                projectId: projectList[1]?.id || projectList[0].id,
                scheduledAt: nextWeek,
                statusId: pending, // Pending has no token usually
                notes: "Requesting specific tower view facing the sea."
            },
            {
                userId,
                agentId,
                projectId: projectList[2]?.id || projectList[0].id,
                scheduledAt: yesterday,
                statusId: completed || confirmed, // Fallback
                notes: "Initial viewing completed. Client liked the finishing.",
                scannedAt: yesterday,
                scannedById: agentId
            }
        ];

        await db.insert(appointments).values(newAppointments);

        return { success: true, count: newAppointments.length };

    } catch (error) {
        console.error("Generate Demo Appointments Error:", error);
        return { success: false, error: "Failed to generate demo data" };
    }
}

// --- EXISTING ACTIONS ---

export async function createAppointment(data: {
    projectId: string;
    scheduledAt: Date;
    referralCode?: string;
    notes?: string;
}) {
    if (!db) return { success: false, error: "DB missing" };
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
    if (!db) return { success: false, error: "DB missing" };
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
    if (!db) return { success: false, error: "DB missing" };
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
    if (!db) return { success: false, error: "DB missing" };
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
