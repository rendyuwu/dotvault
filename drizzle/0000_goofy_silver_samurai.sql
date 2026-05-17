CREATE TABLE "alias_provider_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alias_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"account_identifier" text,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dot_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gmail_account_id" uuid NOT NULL,
	"alias_email" text NOT NULL,
	"local_part_with_dots" text NOT NULL,
	"dot_count" integer NOT NULL,
	"is_original" boolean DEFAULT false NOT NULL,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dot_aliases_dot_count_nonnegative" CHECK ("dot_aliases"."dot_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "gmail_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"original_email" text NOT NULL,
	"canonical_email" text NOT NULL,
	"local_part" text NOT NULL,
	"domain" text DEFAULT 'gmail.com' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"category" text,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alias_provider_links" ADD CONSTRAINT "alias_provider_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alias_provider_links" ADD CONSTRAINT "alias_provider_links_alias_id_dot_aliases_id_fk" FOREIGN KEY ("alias_id") REFERENCES "public"."dot_aliases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alias_provider_links" ADD CONSTRAINT "alias_provider_links_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dot_aliases" ADD CONSTRAINT "dot_aliases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dot_aliases" ADD CONSTRAINT "dot_aliases_gmail_account_id_gmail_accounts_id_fk" FOREIGN KEY ("gmail_account_id") REFERENCES "public"."gmail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_accounts" ADD CONSTRAINT "gmail_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alias_provider_links_user_alias_provider_unique" ON "alias_provider_links" USING btree ("user_id","alias_id","provider_id");--> statement-breakpoint
CREATE INDEX "alias_provider_links_user_archived_idx" ON "alias_provider_links" USING btree ("user_id","archived");--> statement-breakpoint
CREATE INDEX "alias_provider_links_alias_idx" ON "alias_provider_links" USING btree ("alias_id");--> statement-breakpoint
CREATE INDEX "alias_provider_links_provider_idx" ON "alias_provider_links" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dot_aliases_user_alias_email_unique" ON "dot_aliases" USING btree ("user_id","alias_email");--> statement-breakpoint
CREATE INDEX "dot_aliases_user_gmail_account_idx" ON "dot_aliases" USING btree ("user_id","gmail_account_id");--> statement-breakpoint
CREATE INDEX "dot_aliases_user_archived_idx" ON "dot_aliases" USING btree ("user_id","archived");--> statement-breakpoint
CREATE UNIQUE INDEX "gmail_accounts_user_canonical_email_unique" ON "gmail_accounts" USING btree ("user_id","canonical_email");--> statement-breakpoint
CREATE INDEX "gmail_accounts_user_archived_idx" ON "gmail_accounts" USING btree ("user_id","archived");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_user_name_unique" ON "providers" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "providers_user_archived_idx" ON "providers" USING btree ("user_id","archived");