CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE TABLE "identity"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_provider_identity_unique" UNIQUE("provider_id","account_id"),
	CONSTRAINT "account_tokenless_check" CHECK ("identity"."account"."access_token" IS NULL AND "identity"."account"."refresh_token" IS NULL AND "identity"."account"."id_token" IS NULL AND "identity"."account"."access_token_expires_at" IS NULL AND "identity"."account"."refresh_token_expires_at" IS NULL AND "identity"."account"."password" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "identity"."audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text NOT NULL,
	"event_type" text NOT NULL,
	CONSTRAINT "audit_event_type_check" CHECK ("identity"."audit_event"."event_type" ~ '^[a-z][a-z0-9._-]{0,63}$')
);
--> statement-breakpoint
CREATE TABLE "identity"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "identity"."staff_membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by" text,
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_membership_user_organization_unique" UNIQUE("user_id","organization_id"),
	CONSTRAINT "staff_membership_role_check" CHECK ("identity"."staff_membership"."role" IN ('admin', 'agent')),
	CONSTRAINT "staff_membership_status_check" CHECK ("identity"."staff_membership"."status" IN ('active', 'disabled', 'revoked')),
	CONSTRAINT "staff_membership_deactivation_check" CHECK (("identity"."staff_membership"."status" = 'active' AND "identity"."staff_membership"."deactivated_at" IS NULL AND "identity"."staff_membership"."revoked_at" IS NULL) OR ("identity"."staff_membership"."status" = 'disabled' AND "identity"."staff_membership"."deactivated_at" IS NOT NULL AND "identity"."staff_membership"."revoked_at" IS NULL) OR ("identity"."staff_membership"."status" = 'revoked' AND "identity"."staff_membership"."revoked_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "identity"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "identity_user_status_check" CHECK ("identity"."user"."status" IN ('active', 'disabled'))
);
--> statement-breakpoint
CREATE TABLE "identity"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."audit_event" ADD CONSTRAINT "audit_event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "identity"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."session" ADD CONSTRAINT "session_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "identity"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."staff_membership" ADD CONSTRAINT "staff_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."staff_membership" ADD CONSTRAINT "staff_membership_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."staff_membership" ADD CONSTRAINT "staff_membership_deactivated_by_user_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "identity"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."staff_membership" ADD CONSTRAINT "staff_membership_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "identity"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "identity"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_event_actor_occurred_at_idx" ON "identity"."audit_event" USING btree ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "identity"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "identity"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE FUNCTION "identity"."prevent_session_revocation_reversal"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, identity
AS $$
BEGIN
	IF OLD.revoked_at IS NOT NULL AND (
		NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
		OR NEW.revoked_by IS DISTINCT FROM OLD.revoked_by
	) THEN
		RAISE EXCEPTION 'session revocation is terminal'
			USING ERRCODE = '23514',
				CONSTRAINT = 'session_revocation_terminal';
	END IF;
	RETURN NEW;
END
$$;--> statement-breakpoint
CREATE TRIGGER "session_revocation_terminal"
BEFORE UPDATE OF "revoked_at", "revoked_by" ON "identity"."session"
FOR EACH ROW
EXECUTE FUNCTION "identity"."prevent_session_revocation_reversal"();--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_roles
		WHERE rolname = 'pgjb_provisioner'
			AND NOT rolcanlogin
			AND NOT rolsuper
			AND NOT rolcreatedb
			AND NOT rolcreaterole
			AND NOT rolinherit
			AND NOT rolreplication
			AND NOT rolbypassrls
	) THEN
		RAISE EXCEPTION 'identity provisioner role is missing or unsafe';
	END IF;
	IF EXISTS (
		SELECT 1 FROM pg_auth_members membership
		JOIN pg_roles provisioner ON provisioner.oid = membership.roleid
		JOIN pg_roles member ON member.oid = membership.member
		WHERE provisioner.rolname = 'pgjb_provisioner'
			OR member.rolname = 'pgjb_provisioner'
	) THEN
		RAISE EXCEPTION 'identity provisioner role membership is not allowed';
	END IF;
END
$$;
--> statement-breakpoint
REVOKE ALL ON SCHEMA "identity" FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "identity" TO "pgjb_runtime", "pgjb_provisioner";
--> statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA "identity" FROM PUBLIC, "pgjb_runtime", "pgjb_provisioner";
--> statement-breakpoint
GRANT SELECT ON TABLE "identity"."user", "identity"."session", "identity"."staff_membership" TO "pgjb_runtime";
--> statement-breakpoint
GRANT SELECT ("id", "account_id", "provider_id", "user_id") ON TABLE "identity"."account" TO "pgjb_runtime";
--> statement-breakpoint
GRANT INSERT ON TABLE "identity"."session" TO "pgjb_runtime";
--> statement-breakpoint
GRANT UPDATE ("last_activity_at", "revoked_at", "revoked_by") ON TABLE "identity"."session" TO "pgjb_runtime";
--> statement-breakpoint
GRANT DELETE ON TABLE "identity"."session" TO "pgjb_runtime";
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE "identity"."verification" TO "pgjb_runtime";
--> statement-breakpoint
GRANT INSERT ON TABLE "identity"."audit_event" TO "pgjb_runtime";
--> statement-breakpoint
GRANT SELECT ("id", "email") ON TABLE "identity"."user" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT INSERT ("id", "name", "email", "status", "email_verified", "image", "created_at", "updated_at") ON TABLE "identity"."user" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT UPDATE ("name", "status", "email_verified", "image", "updated_at") ON TABLE "identity"."user" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT SELECT ("id", "account_id", "provider_id", "user_id") ON TABLE "identity"."account" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT INSERT ("id", "account_id", "provider_id", "user_id", "scope", "created_at", "updated_at") ON TABLE "identity"."account" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT SELECT ("id", "user_id", "organization_id", "role", "status") ON TABLE "identity"."staff_membership" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT INSERT ON TABLE "identity"."staff_membership" TO "pgjb_provisioner";
--> statement-breakpoint
GRANT UPDATE ("role", "status", "deactivated_at", "deactivated_by", "revoked_at", "revoked_by", "updated_at") ON TABLE "identity"."staff_membership" TO "pgjb_provisioner";