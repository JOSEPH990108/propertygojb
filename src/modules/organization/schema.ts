import { sql } from "drizzle-orm";
import { check, pgSchema, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const organizationSchema = pgSchema("app");

export const organizations = organizationSchema.table(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "organizations_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    check(
      "organizations_display_name_format",
      sql`length(btrim(${table.displayName})) > 0 AND ${table.displayName} = btrim(${table.displayName})`,
    ),
  ],
);
