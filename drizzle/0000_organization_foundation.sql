CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TABLE "app"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_slug_format" CHECK ("app"."organizations"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "organizations_display_name_format" CHECK (length(btrim("app"."organizations"."display_name")) > 0 AND "app"."organizations"."display_name" = btrim("app"."organizations"."display_name"))
);
--> statement-breakpoint
REVOKE ALL ON SCHEMA "app" FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "app" TO "pgjb_runtime";
--> statement-breakpoint
GRANT SELECT ON TABLE "app"."organizations" TO "pgjb_runtime";
