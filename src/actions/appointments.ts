'use server';

import { db } from '@/db';
import { appointments, appointmentStatuses, user, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

interface BookAppointmentData {
  propertyId: string;
  propertyName: string;
  date: Date;
  time: string;
  focus?: string;
  contactName: string;
  contactEmail: string;
}

export async function bookAppointment(data: BookAppointmentData) {
  if (!db) {
    return { success: false, message: "Database connection unavailable." };
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // 1. Resolve User
    let userId = session?.user?.id;

    if (!userId) {
      // Try to find user by email
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, data.contactEmail)
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create a new "Guest" User
        const customerRole = await db.query.roles.findFirst({
            where: eq(roles.code, 'CUSTOMER')
        });

        userId = randomUUID();
        await db.insert(user).values({
          id: userId,
          name: data.contactName,
          email: data.contactEmail,
          roleId: customerRole?.id, // Might be null if seeds failed, but schema allows null? references usually strictly checked.
          emailVerified: false,
          onboardingCompleted: false
        });
      }
    }

    // 2. Resolve Agent (Sarah Tan)
    // Find Sarah by known ID or Email from seeds
    let agentId = 'agent-sarah-tan';
    const sarah = await db.query.user.findFirst({
        where: eq(user.id, 'agent-sarah-tan')
    });

    if (!sarah) {
        // Fallback: try finding by email or just don't assign agent yet?
        // Schema: agentId is optional.
        const backupSarah = await db.query.user.findFirst({ where: eq(user.email, 'sarah.tan@propertygo.com') });
        if (backupSarah) agentId = backupSarah.id;
        else agentId = ""; // Leave empty if not found
    }

    // 3. Resolve Status
    const pendingStatus = await db.query.appointmentStatuses.findFirst({
        where: eq(appointmentStatuses.code, 'PENDING')
    });

    if (!pendingStatus) {
        return { success: false, message: "System Error: 'PENDING' status missing." };
    }

    // 4. Combine Date + Time into scheduledAt
    // data.date is a Date object (usually 00:00:00). data.time is string "10:00 AM"
    // We need to parse time and add to date.
    const scheduledAt = new Date(data.date);
    const timeParts = data.time.match(/(\d+):(\d+) (AM|PM)/);
    if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const meridiem = timeParts[3];

        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;

        scheduledAt.setHours(hours, minutes, 0, 0);
    }

    // 5. Insert Appointment
    await db.insert(appointments).values({
      userId: userId!,
      projectId: data.propertyId, // Assuming propertyId maps to projectId in schema
      scheduledAt: scheduledAt,
      statusId: pendingStatus.id,
      agentId: agentId || undefined,
      notes: `Focus: ${data.focus || 'General Viewing'}`,
    });

    // 6. Revalidate
    revalidatePath('/appointments');
    revalidatePath('/demo-page');

    return { success: true, message: "Your private tour has been booked." };

  } catch (error) {
    console.error("Book Appointment Error:", error);
    return { success: false, message: "Failed to book appointment. Please try again." };
  }
}
