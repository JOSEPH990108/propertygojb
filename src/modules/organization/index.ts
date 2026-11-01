import "server-only";
import { eq } from "drizzle-orm";
import { getDatabase } from "../../db/client";
import { DatabaseError, errorCode, readDatabaseConfig } from "../../db/config";
import { organizations } from "./schema";

export type OrganizationContext = Pick<
  typeof organizations.$inferSelect,
  "id" | "slug" | "displayName"
>;

export async function getOrganization(): Promise<OrganizationContext> {
  const organizationId = readDatabaseConfig().organizationId;
  const db = await getDatabase();
  try {
    const [organization] = await db
      .select({
        id: organizations.id,
        slug: organizations.slug,
        displayName: organizations.displayName,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId));
    if (!organization) throw new DatabaseError("ORGANIZATION_NOT_CONFIGURED");
    return organization;
  } catch (error) {
    console.error(`[organization:resolve] ${errorCode(error)}`);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError("ORGANIZATION_LOOKUP_FAILED");
  }
}
