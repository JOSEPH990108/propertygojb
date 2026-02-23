// src\app\actions\profile-actions.ts
"use server";

import { z } from "zod";
import { db } from "@/db";
import { user, userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth"; // Correct import path for auth
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// --- Zod Schemas ---

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().optional().nullable(), // Allow null/empty
  nationality: z.string().optional().nullable(),
});

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  notificationSettings: z.object({
    email: z.boolean(),
    whatsapp: z.boolean(),
  }).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PreferencesFormValues = z.infer<typeof preferencesSchema>;

// --- Actions ---

export async function updateProfile(data: ProfileFormValues) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedFields = profileSchema.parse(data);

    await db
      .update(user)
      .set({
        name: validatedFields.name,
        phoneNumber: validatedFields.phoneNumber,
        nationality: validatedFields.nationality,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid data", details: (error as any).errors };
    }
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updatePreferences(data: PreferencesFormValues) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedFields = preferencesSchema.parse(data);

    // check if preferences exist
    const existingPrefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    });

    if (existingPrefs) {
      await db
        .update(userPreferences)
        .set({
          ...validatedFields,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id));
    } else {
      await db.insert(userPreferences).values({
        userId: session.user.id,
        ...validatedFields,
      });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}
