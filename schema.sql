


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."provider_source" AS ENUM (
    'self',
    'personal',
    'invitation',
    'manual'
);


ALTER TYPE "public"."provider_source" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Обновляем поле email_confirmed_at в нашей таблице public.users
  UPDATE public.users
  SET email_confirmed_at = new.email_confirmed_at
  WHERE id = new.id;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prune_password_history"("uid" "uuid", "keep_count" integer DEFAULT 3) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN DELETE FROM public.password_history WHERE user_id = uid AND id NOT IN ( SELECT id FROM public.password_history WHERE user_id = uid ORDER BY created_at DESC LIMIT keep_count ); END; $$;


ALTER FUNCTION "public"."prune_password_history"("uid" "uuid", "keep_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_image_moderation_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_image_moderation_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_public_users_email_after_auth_confirm"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Сработаем только когда подтверждение email прошло (NULL -> NOT NULL)
  IF TG_OP = 'UPDATE' THEN
    IF (
      (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
      OR
      (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
    ) THEN
      UPDATE public.users
      SET email = NEW.email
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_public_users_email_after_auth_confirm"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_public_users_email_after_confirm_v2"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_email_confirmed_at timestamptz;
BEGIN
  -- Берем подтвержденность из email_confirmed_at, если оно есть,
  -- иначе fallback на confirmed_at
  v_email_confirmed_at := NEW.email_confirmed_at;

  IF v_email_confirmed_at IS NULL THEN
    v_email_confirmed_at := NEW.confirmed_at;
  END IF;

  -- Обновляем только когда:
  -- 1) email подтвержден (есть timestamp)
  -- 2) email реально изменился
  IF v_email_confirmed_at IS NOT NULL
     AND NEW.email IS DISTINCT FROM OLD.email
  THEN
    UPDATE public.users
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_public_users_email_after_confirm_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_app_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_app_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "invite_code" "text",
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "role" "text",
    "expires_at" timestamp with time zone,
    "is_active" boolean,
    "max_uses" integer,
    "uses_count" integer,
    "used_at" timestamp with time zone
);


ALTER TABLE "public"."admin_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_login_logs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_id" "uuid",
    "username" character varying,
    "user_agent" "text",
    "login_time" timestamp with time zone DEFAULT "now"(),
    "success" boolean,
    "failure_reason" "text",
    "session_token" "text"
);


ALTER TABLE "public"."admin_login_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_login_logs" IS 'Логи входов администраторов';



COMMENT ON COLUMN "public"."admin_login_logs"."success" IS 'Успешность попытки входа';



COMMENT ON COLUMN "public"."admin_login_logs"."failure_reason" IS 'Причина неудачного входа';



ALTER TABLE "public"."admin_login_logs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."admin_login_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "setting_key" character varying NOT NULL,
    "setting_value" "text",
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "setting_type" "text",
    "updated_by" "uuid"
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_settings" IS 'Настройки администраторской панели';



COMMENT ON COLUMN "public"."admin_settings"."setting_key" IS 'Ключ настройки в формате category.key';



COMMENT ON COLUMN "public"."admin_settings"."setting_value" IS 'Значение настройки в строковом формате';



COMMENT ON COLUMN "public"."admin_settings"."setting_type" IS 'Тип данных настройки (string, number, boolean)';



CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" character varying,
    "password_hash" character varying,
    "role" character varying,
    "is_active" boolean,
    "updated_at" timestamp with time zone,
    "last_login" timestamp with time zone,
    "created_by" "uuid" DEFAULT "gen_random_uuid"(),
    "status" "text",
    "invite_code" "text",
    "permissions" "text"[] DEFAULT '{[]}'::"text"[]
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token_hash" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'supabase'::"text" NOT NULL,
    "provider_user_id" "text" NOT NULL,
    "provider_access_token" "text" NOT NULL,
    "provider_refresh_token" "text" NOT NULL,
    "provider_access_token_expires_at" timestamp with time zone,
    "auth_level" "text" DEFAULT 'aal1'::"text" NOT NULL,
    "user_agent" "text",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."app_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_settings" IS 'Global configurable settings managed via admin panel. Cast values to the appropriate type in application code.';



CREATE TABLE IF NOT EXISTS "public"."archived_job_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "job_snapshot" "jsonb",
    "seen" boolean DEFAULT false NOT NULL,
    "seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "archived_job_references_reason_check" CHECK (("reason" = ANY (ARRAY['not_selected'::"text", 'confirmation_expired'::"text", 'job_expired'::"text", 'job_deleted'::"text", 'offer_rejected'::"text", 'job_cancelled'::"text", 'provider_charge_failed'::"text", 'client_charge_failed'::"text"]))),
    CONSTRAINT "archived_job_references_role_check" CHECK (("role" = ANY (ARRAY['provider'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."archived_job_references" OWNER TO "postgres";


COMMENT ON TABLE "public"."archived_job_references" IS 'Lightweight job references for users who can no longer interact with a job. Shown with a reason popup until dismissed.';



COMMENT ON COLUMN "public"."archived_job_references"."job_snapshot" IS 'Minimal job data snapshot: { title, status, created_at, jobType, price }. Preserved even after job hard-delete.';



COMMENT ON COLUMN "public"."archived_job_references"."seen" IS 'True after the user dismisses the unavailability popup. Records with seen=true are eligible for cron cleanup.';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "rating" real,
    "job_id" "uuid"
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "email" "text",
    "topic" "text",
    "reason" "text",
    "message" "text",
    "status" "text",
    "priority" "text",
    "assigned_to" "text",
    "response_message" "text",
    "responded_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


ALTER TABLE "public"."contact_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contact_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."coupon_transactions" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userId" "uuid",
    "referralUserId" "uuid",
    "context" "text",
    "status" "text",
    "updated_at" timestamp with time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."coupon_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "userId" "uuid",
    "count" integer,
    "updated_at" timestamp with time zone,
    "authorized_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_number" "text",
    "user_id" "uuid",
    "user_email" "text",
    "status" "text",
    "preferred_time" timestamp with time zone,
    "message" "text",
    "contact_attempts" integer,
    "contacted_at" timestamp with time zone,
    "notes" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."feedback_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_moderation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "images" "text"[] NOT NULL,
    "uploader" "uuid" NOT NULL,
    "moderator" "uuid",
    "rejection_reason" "text",
    "comment" "text",
    "type" "text" DEFAULT 'avatar'::"text" NOT NULL,
    CONSTRAINT "image_moderation_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'moderated'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."image_moderation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_comments" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "job_id" "uuid",
    "images" "text"[],
    "comment" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."job_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "provider_payment_id" "text",
    "provider_charge_status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "provider_charge_attempts" integer DEFAULT 1 NOT NULL,
    "provider_next_attempt_at" timestamp with time zone,
    "provider_charged_at" timestamp with time zone,
    "provider_refunded_at" timestamp with time zone,
    "provider_charge_error" "text",
    "client_payment_id" "text",
    "client_charge_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "client_charge_attempts" integer DEFAULT 0 NOT NULL,
    "client_next_attempt_at" timestamp with time zone,
    "client_charged_at" timestamp with time zone,
    "client_charge_error" "text",
    "overall_status" "text" DEFAULT 'charging'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "job_deals_client_charge_status_check" CHECK (("client_charge_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'retrying'::"text", 'failed_final'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "job_deals_overall_status_check" CHECK (("overall_status" = ANY (ARRAY['charging'::"text", 'completed'::"text", 'provider_failed'::"text", 'client_failed'::"text"]))),
    CONSTRAINT "job_deals_provider_charge_status_check" CHECK (("provider_charge_status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'retrying'::"text", 'failed_final'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."job_deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_providers" (
    "job_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "source" "public"."provider_source" DEFAULT 'self'::"public"."provider_source" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'none'::"text",
    "updated_at" timestamp with time zone,
    "job_agreement" "text" DEFAULT 'agreed'::"text" NOT NULL,
    "agreement_change_date" "text",
    "proposed_price" numeric(12,2) DEFAULT NULL::numeric,
    "proposed_time_from" timestamp with time zone,
    "payment_id" "uuid",
    "selected_at" timestamp with time zone,
    "confirmation_expires_at" timestamp with time zone,
    "submitted_at" timestamp with time zone,
    "proposed_time_to" timestamp with time zone,
    "source_timezone" "text",
    CONSTRAINT "job_providers_job_agreement_check" CHECK (("job_agreement" = ANY (ARRAY['agreed'::"text", 'not_defined'::"text"])))
);


ALTER TABLE "public"."job_providers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."job_providers"."agreement_change_date" IS 'ISO timestamp matching the changes_history entry that requires provider agreement. NULL when job_agreement = ''agreed'' and no pending update.';



COMMENT ON COLUMN "public"."job_providers"."proposed_price" IS 'Provider proposed price for client-created jobs. NULL for business-created jobs (price set by job creator).';



COMMENT ON COLUMN "public"."job_providers"."proposed_time_from" IS 'Provider proposed start date for client-created jobs. NULL for business-created jobs.';



COMMENT ON COLUMN "public"."job_providers"."payment_id" IS 'UUID of the provider payment record in the payments table (their authorize/capture).';



COMMENT ON COLUMN "public"."job_providers"."selected_at" IS 'Timestamp when client selected this provider. Triggers PENDING_SUPPLIER_APPROVAL TTL.';



COMMENT ON COLUMN "public"."job_providers"."confirmation_expires_at" IS 'Deadline by which provider must confirm. After this, status moves to EXPIRED.';



COMMENT ON COLUMN "public"."job_providers"."submitted_at" IS 'Timestamp when provider submitted the offer. Used for 24h SUBMITTED TTL enforcement.';



COMMENT ON COLUMN "public"."job_providers"."proposed_time_to" IS 'Provider proposed end date for client-created jobs. NULL for business-created jobs.';



COMMENT ON COLUMN "public"."job_providers"."source_timezone" IS 'Original IANA timezone used when the provider selected proposed_time_from/proposed_time_to.';



CREATE TABLE IF NOT EXISTS "public"."job_subtypes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "requires_verification" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name_i18n" "jsonb"
);


ALTER TABLE "public"."job_subtypes" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_subtypes" IS 'Подтипы работ (установка солнечных батарей, покраска стен)';



COMMENT ON COLUMN "public"."job_subtypes"."requires_verification" IS 'Требует ли данный подтип дополнительной верификации';



CREATE TABLE IF NOT EXISTS "public"."job_type_subtypes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_type_id" "uuid",
    "job_subtype_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_type_subtypes" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_type_subtypes" IS 'Связь типов и подтипов профессий (многие ко многим)';



CREATE TABLE IF NOT EXISTS "public"."job_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "requires_verification" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name_i18n" "jsonb"
);


ALTER TABLE "public"."job_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_types" IS 'Основные типы профессий (электрик, маляр, сантехник)';



COMMENT ON COLUMN "public"."job_types"."key" IS 'Уникальный ключ типа профессии (painter, electrician)';



COMMENT ON COLUMN "public"."job_types"."requires_verification" IS 'Требует ли данный тип профессии обязательной верификации';



CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "uuid",
    "subType" "uuid",
    "description" "text",
    "price" "text",
    "images" "text"[],
    "startDateTime" timestamp with time zone,
    "endDateTime" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "status" "text",
    "creator" "uuid",
    "doneComment" "text",
    "extraMarker" "text",
    "changes_history" "jsonb" DEFAULT '[]'::"jsonb",
    "location" "jsonb",
    "executor" "uuid",
    "isDone" boolean DEFAULT false,
    "isClosed" boolean DEFAULT false,
    "jobType" "text" DEFAULT 'normal'::"text",
    "isRated" boolean DEFAULT false,
    "moderated_by" "uuid",
    "moderated_at" timestamp with time zone,
    "moderation_comment" "text",
    "rejection_reason" "text",
    "updated_at" timestamp with time zone,
    "experience" "jsonb",
    "isRejectionNoticedByUser" boolean DEFAULT false,
    "is_paid" boolean,
    "created_by_account_type" "text",
    "expires_at" timestamp with time zone,
    "source_timezone" "text",
    "endLocal" "text",
    "startLocal" "text",
    CONSTRAINT "jobs_created_by_account_type_check" CHECK (("created_by_account_type" = ANY (ARRAY['client'::"text", 'business'::"text"]))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'pending_moderation'::"text", 'requires_editing'::"text", 'waiting'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."isRated" IS 'check done job was rated';



COMMENT ON COLUMN "public"."jobs"."created_by_account_type" IS 'Snapshot of creator account_type (client|business) at job creation time. Determines provider offer rules.';



COMMENT ON COLUMN "public"."jobs"."expires_at" IS 'Timestamp when the job expires. Set when job transitions to waiting status. Populated from app_settings[job_expiry_days].';



COMMENT ON COLUMN "public"."jobs"."source_timezone" IS 'Original IANA timezone used when the job start/end datetime was selected.';



CREATE TABLE IF NOT EXISTS "public"."jobs_moderation_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "admin_id" "uuid",
    "action" character varying,
    "reason" character varying,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jobs_moderation_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "channel" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_logs_channel_check" CHECK (("channel" = ANY (ARRAY['push'::"text", 'email'::"text", 'push+email'::"text"]))),
    CONSTRAINT "notification_logs_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'failed'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."password_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_token" "text" NOT NULL,
    "last4" "text",
    "brand" "text",
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb",
    "is_default_purchase" boolean DEFAULT false NOT NULL,
    "is_default_subscription" boolean DEFAULT false NOT NULL,
    "email" character varying(255)
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "productId" "text",
    "userId" "uuid" DEFAULT "gen_random_uuid"(),
    "feature" "text",
    "status" "text",
    "amount" real,
    "currency" "text" DEFAULT 'USD'::"text",
    "paymentMetadata" json,
    "method" "text" NOT NULL,
    "updated_at" timestamp with time zone,
    "payment_method_id" "text",
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'authorized'::"text", 'paid'::"text", 'canceled'::"text", 'voided'::"text", 'refunded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payments"."status" IS 'pending → authorized → paid → refunded | voided | canceled | failed';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "description" "text",
    "category" "text",
    "type" "text",
    "price" real,
    "currency" "text",
    "paypal_product_id" "text",
    "features" "text",
    "is_active" boolean,
    "name_i18n" "jsonb",
    "prices" "jsonb"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profession_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "job_type_id" "uuid",
    "job_subtype_id" "uuid",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "rejection_reason" "text",
    "moderator_id" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "passport_photo_urls" "jsonb" NOT NULL,
    "certificate_photo_urls" "jsonb" NOT NULL,
    "years_of_experience" "jsonb",
    CONSTRAINT "check_certificate_photos_not_empty" CHECK (("jsonb_array_length"("certificate_photo_urls") > 0)),
    CONSTRAINT "check_passport_photos_not_empty" CHECK (("jsonb_array_length"("passport_photo_urls") > 0)),
    CONSTRAINT "check_years_of_experience_format" CHECK ((("years_of_experience" IS NULL) OR (("jsonb_typeof"("years_of_experience") = 'object'::"text") AND ((("years_of_experience" ->> 'years'::"text"))::integer >= 0) AND ((("years_of_experience" ->> 'months'::"text"))::integer >= 0) AND ((("years_of_experience" ->> 'months'::"text"))::integer < 12)))),
    CONSTRAINT "profession_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."profession_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."profession_requests" IS 'Запросы пользователей на получение профессии с документами';



COMMENT ON COLUMN "public"."profession_requests"."status" IS 'Статус запроса: pending, approved, rejected';



COMMENT ON COLUMN "public"."profession_requests"."years_of_experience" IS 'Years of work experience claimed by user - format: {"years": 0, "months": 1} (optional for non-verified professions)';



CREATE TABLE IF NOT EXISTS "public"."subscription_payments" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subscription_id" "text",
    "amount" real,
    "currency" "text",
    "status" "text",
    "payment_method" "text",
    "external_payment_id" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text",
    "billing_period_start" timestamp with time zone,
    "idempotency_key" "text",
    "attempt_count" integer,
    "error_message" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."subscription_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_payments" IS 'Автооплата подписок';



CREATE TABLE IF NOT EXISTS "public"."subscription_plan_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "subscription_id" "uuid",
    "change_type" "text",
    "previous_paypal_plan_id" "text",
    "target_paypal_plan_id" "text",
    "plan_change_url" "text",
    "plan_change_url_expiration" timestamp without time zone,
    "paypal_revision_id" "text",
    "effective_date" timestamp without time zone,
    "prorated_amount" smallint,
    "status" "text",
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "notes" "text",
    "paypal_approval_completed_at" timestamp without time zone,
    "cancelled_at" timestamp without time zone,
    "manual_payment_amount" real,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."subscription_plan_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "description" "text",
    "currency" "text",
    "billing_period" "text" DEFAULT 'month'::"text",
    "interval_count" smallint DEFAULT '1'::smallint,
    "paypal_plan_id" "text",
    "features" "text",
    "limits" "text",
    "level" smallint,
    "is_popular" boolean,
    "is_active" boolean,
    "id" "text" NOT NULL,
    "name_i18n" "jsonb",
    "description_i18n" "jsonb",
    "features_i18n" "jsonb",
    "prices" "jsonb",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subscription_plans_id" "text",
    "provider_subscription_id" "text",
    "status" "text",
    "current_period_start" timestamp without time zone,
    "current_period_end" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cancelled_at" timestamp with time zone,
    "provider" "text" DEFAULT 'PAYPAL'::"text",
    "payment_method_id" "uuid",
    "next_billing_at" timestamp with time zone,
    "retry_count" integer,
    "grace_until" timestamp with time zone,
    "subscribed_currency" "text",
    "subscribed_amount" real
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test-auth" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auth_code" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."test-auth" OWNER TO "postgres";


ALTER TABLE "public"."test-auth" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."test-auth_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."type_creation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "requested_type_name" character varying(100) NOT NULL,
    "requested_subtype_name" character varying(100) NOT NULL,
    "selected_type_id" "uuid",
    "final_type_id" "uuid",
    "final_subtype_id" "uuid",
    "final_type_name" character varying(100),
    "final_subtype_name" character varying(100),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "rejection_reason" "text",
    "moderator_id" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "final_type_name_i18n" "text",
    "final_subtype_name_i18n" "text",
    CONSTRAINT "type_creation_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."type_creation_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."type_creation_requests" IS 'Запросы на создание новых типов и подтипов работ';



COMMENT ON COLUMN "public"."type_creation_requests"."selected_type_id" IS 'ID выбранного существующего типа (если пользователь выбрал из списка)';



COMMENT ON COLUMN "public"."type_creation_requests"."final_type_id" IS 'Финальный ID типа после обработки модератором';



COMMENT ON COLUMN "public"."type_creation_requests"."final_subtype_id" IS 'Финальный ID подтипа после обработки модератором';



CREATE TABLE IF NOT EXISTS "public"."user_access_rights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "buyer_id" "uuid",
    "target_user_id" "uuid",
    "access_type" "text" DEFAULT 'USER_INFO'::"text",
    "granted_at" timestamp without time zone,
    "expires_at" timestamp without time zone,
    "payment_id" "uuid" DEFAULT "gen_random_uuid"(),
    "status" "text"
);


ALTER TABLE "public"."user_access_rights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "push_token" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "provider" "text" DEFAULT 'expo'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_devices_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text", 'web'::"text"]))),
    CONSTRAINT "user_devices_provider_check" CHECK (("provider" = ANY (ARRAY['expo'::"text", 'fcm'::"text", 'apns'::"text"])))
);


ALTER TABLE "public"."user_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_job_types" (
    "user_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL
);


ALTER TABLE "public"."user_job_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_owned_professions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "job_type_id" "uuid",
    "job_subtype_id" "uuid",
    "is_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "years_of_experience" "jsonb",
    CONSTRAINT "check_years_of_experience_format" CHECK ((("years_of_experience" IS NULL) OR (("jsonb_typeof"("years_of_experience") = 'object'::"text") AND ((("years_of_experience" ->> 'years'::"text"))::integer >= 0) AND ((("years_of_experience" ->> 'months'::"text"))::integer >= 0) AND ((("years_of_experience" ->> 'months'::"text"))::integer < 12))))
);


ALTER TABLE "public"."user_owned_professions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_owned_professions" IS 'Профессии которыми владеет пользователь с верификацией';



COMMENT ON COLUMN "public"."user_owned_professions"."expires_at" IS 'Срок действия верификации (NULL = бессрочно)';



COMMENT ON COLUMN "public"."user_owned_professions"."years_of_experience" IS 'Years of work experience in this profession - format: {"years": 0, "months": 1} (optional for non-verified professions)';



CREATE TABLE IF NOT EXISTS "public"."user_professions" (
    "user_id" "uuid" NOT NULL,
    "profession" "text" NOT NULL
);


ALTER TABLE "public"."user_professions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_security" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mfa_enabled" boolean,
    "phone_verified" boolean,
    "phone" "text",
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."user_security" OWNER TO "postgres";


ALTER TABLE "public"."user_security" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_security_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "surname" "text",
    "about" "text",
    "location" "text",
    "email" "text",
    "phoneNumber" "text",
    "professions" "text"[],
    "jobTypes" "text"[],
    "jobSubTypes" "text"[],
    "avatar" "text",
    "firstauth" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "qualificationLevel" "text",
    "experience" "text",
    "is_password_exist" boolean DEFAULT false,
    "referral_code" "text",
    "isPhoneVerified" "text",
    "email_confirmed_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false,
    "account_type" "text" DEFAULT 'client'::"text" NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "users_account_type_check" CHECK (("account_type" = ANY (ARRAY['client'::"text", 'business'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."is_password_exist" IS 'if user was created without password (by OTP) this field equal false';



COMMENT ON COLUMN "public"."users"."account_type" IS 'Account type: client or business. Provider capability is determined by account_type=business + having professions.';



ALTER TABLE ONLY "public"."admin_invites"
    ADD CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_login_logs"
    ADD CONSTRAINT "admin_login_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_sessions"
    ADD CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_sessions"
    ADD CONSTRAINT "app_sessions_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."archived_job_references"
    ADD CONSTRAINT "archived_job_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_transactions"
    ADD CONSTRAINT "coupon_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "cupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_requests"
    ADD CONSTRAINT "feedback_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."image_moderation"
    ADD CONSTRAINT "image_moderation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_comments"
    ADD CONSTRAINT "job_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_deals"
    ADD CONSTRAINT "job_deals_job_id_provider_id_client_id_key" UNIQUE ("job_id", "provider_id", "client_id");



ALTER TABLE ONLY "public"."job_deals"
    ADD CONSTRAINT "job_deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs_moderation_actions"
    ADD CONSTRAINT "job_moderation_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_providers"
    ADD CONSTRAINT "job_providers_pkey" PRIMARY KEY ("job_id", "provider_id");



ALTER TABLE ONLY "public"."job_subtypes"
    ADD CONSTRAINT "job_subtypes_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."job_subtypes"
    ADD CONSTRAINT "job_subtypes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_type_subtypes"
    ADD CONSTRAINT "job_type_subtypes_job_type_id_job_subtype_id_key" UNIQUE ("job_type_id", "job_subtype_id");



ALTER TABLE ONLY "public"."job_type_subtypes"
    ADD CONSTRAINT "job_type_subtypes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_types"
    ADD CONSTRAINT "job_types_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."job_types"
    ADD CONSTRAINT "job_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_history"
    ADD CONSTRAINT "password_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profession_requests"
    ADD CONSTRAINT "profession_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plan_changes"
    ADD CONSTRAINT "subscription_plan_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test-auth"
    ADD CONSTRAINT "test-auth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."type_creation_requests"
    ADD CONSTRAINT "type_creation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "unique_subscription_period" UNIQUE ("subscription_id", "billing_period_start");



ALTER TABLE ONLY "public"."user_access_rights"
    ADD CONSTRAINT "user_access_rights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_job_types"
    ADD CONSTRAINT "user_job_types_pkey" PRIMARY KEY ("user_id", "job_type");



ALTER TABLE ONLY "public"."user_owned_professions"
    ADD CONSTRAINT "user_owned_professions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_owned_professions"
    ADD CONSTRAINT "user_owned_professions_user_id_job_type_id_job_subtype_id_key" UNIQUE ("user_id", "job_type_id", "job_subtype_id");



ALTER TABLE ONLY "public"."user_professions"
    ADD CONSTRAINT "user_professions_pkey" PRIMARY KEY ("user_id", "profession");



ALTER TABLE ONLY "public"."user_security"
    ADD CONSTRAINT "user_security_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_security"
    ADD CONSTRAINT "user_security_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_login_logs_admin_id" ON "public"."admin_login_logs" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_login_logs_time" ON "public"."admin_login_logs" USING "btree" ("login_time");



CREATE INDEX "idx_admin_settings_key" ON "public"."admin_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_app_sessions_user_active" ON "public"."app_sessions" USING "btree" ("user_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_app_sessions_user_id" ON "public"."app_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_archived_job_refs_created" ON "public"."archived_job_references" USING "btree" ("created_at") WHERE ("seen" = false);



CREATE INDEX "idx_archived_job_refs_seen_at" ON "public"."archived_job_references" USING "btree" ("seen_at") WHERE ("seen" = true);



CREATE UNIQUE INDEX "idx_archived_job_refs_unique" ON "public"."archived_job_references" USING "btree" ("job_id", "user_id", "reason");



CREATE INDEX "idx_archived_job_refs_user" ON "public"."archived_job_references" USING "btree" ("user_id", "seen");



CREATE INDEX "idx_image_moderation_created" ON "public"."image_moderation" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_image_moderation_status" ON "public"."image_moderation" USING "btree" ("status");



CREATE INDEX "idx_image_moderation_type" ON "public"."image_moderation" USING "btree" ("type");



CREATE INDEX "idx_image_moderation_uploader" ON "public"."image_moderation" USING "btree" ("uploader");



CREATE INDEX "idx_job_deals_charging" ON "public"."job_deals" USING "btree" ("overall_status") WHERE ("overall_status" = 'charging'::"text");



CREATE INDEX "idx_job_deals_client_retry" ON "public"."job_deals" USING "btree" ("client_next_attempt_at") WHERE ("client_charge_status" = 'retrying'::"text");



CREATE INDEX "idx_job_deals_job_id" ON "public"."job_deals" USING "btree" ("job_id");



CREATE INDEX "idx_job_deals_provider_retry" ON "public"."job_deals" USING "btree" ("provider_next_attempt_at") WHERE ("provider_charge_status" = 'retrying'::"text");



CREATE INDEX "idx_job_providers_agreement" ON "public"."job_providers" USING "btree" ("job_id", "job_agreement");



CREATE INDEX "idx_job_providers_conf_expires" ON "public"."job_providers" USING "btree" ("confirmation_expires_at") WHERE ("status" = 'pending_supplier_approval'::"text");



CREATE INDEX "idx_job_providers_payment_id" ON "public"."job_providers" USING "btree" ("payment_id");



CREATE INDEX "idx_job_providers_provider" ON "public"."job_providers" USING "btree" ("provider_id");



CREATE INDEX "idx_job_providers_status" ON "public"."job_providers" USING "btree" ("job_id", "status");



CREATE INDEX "idx_job_providers_submitted_at" ON "public"."job_providers" USING "btree" ("submitted_at") WHERE ("status" = 'submitted'::"text");



CREATE INDEX "idx_job_subtypes_key" ON "public"."job_subtypes" USING "btree" ("key");



CREATE INDEX "idx_job_subtypes_verification" ON "public"."job_subtypes" USING "btree" ("requires_verification");



CREATE INDEX "idx_job_type_subtypes_subtype" ON "public"."job_type_subtypes" USING "btree" ("job_subtype_id");



CREATE INDEX "idx_job_type_subtypes_type" ON "public"."job_type_subtypes" USING "btree" ("job_type_id");



CREATE INDEX "idx_job_types_key" ON "public"."job_types" USING "btree" ("key");



CREATE INDEX "idx_job_types_verification" ON "public"."job_types" USING "btree" ("requires_verification");



CREATE INDEX "idx_jobs_creator" ON "public"."jobs" USING "btree" ("creator");



CREATE INDEX "idx_jobs_expires_at" ON "public"."jobs" USING "btree" ("expires_at") WHERE ("status" = 'waiting'::"text");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_status_expired" ON "public"."jobs" USING "btree" ("status", "updated_at") WHERE ("status" = 'expired'::"text");



CREATE INDEX "idx_notification_logs_user" ON "public"."notification_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_password_history_user_created" ON "public"."password_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_payments_status_authorized" ON "public"."payments" USING "btree" ("status", "updated_at") WHERE ("status" = 'authorized'::"text");



CREATE INDEX "idx_payments_status_failed" ON "public"."payments" USING "btree" ("status", "updated_at") WHERE ("status" = 'failed'::"text");



CREATE INDEX "idx_profession_requests_certificate_photos" ON "public"."profession_requests" USING "gin" ("certificate_photo_urls");



CREATE INDEX "idx_profession_requests_created" ON "public"."profession_requests" USING "btree" ("created_at");



CREATE INDEX "idx_profession_requests_moderator" ON "public"."profession_requests" USING "btree" ("moderator_id");



CREATE INDEX "idx_profession_requests_passport_photos" ON "public"."profession_requests" USING "gin" ("passport_photo_urls");



CREATE INDEX "idx_profession_requests_status" ON "public"."profession_requests" USING "btree" ("status");



CREATE INDEX "idx_profession_requests_user" ON "public"."profession_requests" USING "btree" ("user_id");



CREATE INDEX "idx_type_creation_requests_created" ON "public"."type_creation_requests" USING "btree" ("created_at");



CREATE INDEX "idx_type_creation_requests_moderator" ON "public"."type_creation_requests" USING "btree" ("moderator_id");



CREATE INDEX "idx_type_creation_requests_status" ON "public"."type_creation_requests" USING "btree" ("status");



CREATE INDEX "idx_type_creation_requests_user" ON "public"."type_creation_requests" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_user_devices_push_token" ON "public"."user_devices" USING "btree" ("push_token");



CREATE INDEX "idx_user_devices_user_active" ON "public"."user_devices" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_user_owned_professions_subtype" ON "public"."user_owned_professions" USING "btree" ("job_subtype_id");



CREATE INDEX "idx_user_owned_professions_type" ON "public"."user_owned_professions" USING "btree" ("job_type_id");



CREATE INDEX "idx_user_owned_professions_user" ON "public"."user_owned_professions" USING "btree" ("user_id");



CREATE INDEX "idx_user_owned_professions_verified" ON "public"."user_owned_professions" USING "btree" ("is_verified");



CREATE INDEX "idx_user_security_user_id" ON "public"."user_security" USING "btree" ("user_id");



CREATE INDEX "idx_users_account_type" ON "public"."users" USING "btree" ("account_type");



CREATE INDEX "idx_users_deleted_at" ON "public"."users" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "job_providers_created_at_idx" ON "public"."job_providers" USING "btree" ("created_at");



CREATE INDEX "job_providers_created_by_idx" ON "public"."job_providers" USING "btree" ("created_by");



CREATE INDEX "job_providers_provider_status_idx" ON "public"."job_providers" USING "btree" ("provider_id", "status");



CREATE INDEX "jobs_marketplace_idx" ON "public"."jobs" USING "btree" ("status", "type", "subType") WHERE ("status" = 'waiting'::"text");



CREATE UNIQUE INDEX "uniq_payment_methods_default_purchase" ON "public"."payment_methods" USING "btree" ("user_id") WHERE (("is_default_purchase" = true) AND ("is_active" = true));



CREATE UNIQUE INDEX "uniq_payment_methods_default_subscription" ON "public"."payment_methods" USING "btree" ("user_id") WHERE (("is_default_subscription" = true) AND ("is_active" = true));



CREATE OR REPLACE TRIGGER "trg_image_moderation_updated_at" BEFORE UPDATE ON "public"."image_moderation" FOR EACH ROW EXECUTE FUNCTION "public"."set_image_moderation_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_app_settings_updated_at" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_app_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_app_sessions_updated_at" BEFORE UPDATE ON "public"."app_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_subtypes_updated_at" BEFORE UPDATE ON "public"."job_subtypes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_types_updated_at" BEFORE UPDATE ON "public"."job_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profession_requests_updated_at" BEFORE UPDATE ON "public"."profession_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_type_creation_requests_updated_at" BEFORE UPDATE ON "public"."type_creation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_owned_professions_updated_at" BEFORE UPDATE ON "public"."user_owned_professions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_security_updated_at" BEFORE UPDATE ON "public"."user_security" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_invites"
    ADD CONSTRAINT "admin_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."admin_login_logs"
    ADD CONSTRAINT "admin_login_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."app_sessions"
    ADD CONSTRAINT "app_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."archived_job_references"
    ADD CONSTRAINT "archived_job_references_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_transactions"
    ADD CONSTRAINT "coupon_transactions_referralUserId_fkey" FOREIGN KEY ("referralUserId") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."coupon_transactions"
    ADD CONSTRAINT "coupon_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "cupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."image_moderation"
    ADD CONSTRAINT "image_moderation_moderator_fkey" FOREIGN KEY ("moderator") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."image_moderation"
    ADD CONSTRAINT "image_moderation_uploader_fkey" FOREIGN KEY ("uploader") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_comments"
    ADD CONSTRAINT "job_comments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."job_deals"
    ADD CONSTRAINT "job_deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."job_deals"
    ADD CONSTRAINT "job_deals_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_deals"
    ADD CONSTRAINT "job_deals_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."jobs_moderation_actions"
    ADD CONSTRAINT "job_moderation_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."jobs_moderation_actions"
    ADD CONSTRAINT "job_moderation_actions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."job_providers"
    ADD CONSTRAINT "job_providers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_providers"
    ADD CONSTRAINT "job_providers_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_providers"
    ADD CONSTRAINT "job_providers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_type_subtypes"
    ADD CONSTRAINT "job_type_subtypes_job_subtype_id_fkey" FOREIGN KEY ("job_subtype_id") REFERENCES "public"."job_subtypes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_type_subtypes"
    ADD CONSTRAINT "job_type_subtypes_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "public"."job_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_creator_fkey" FOREIGN KEY ("creator") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_executor_fkey" FOREIGN KEY ("executor") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "public"."admins"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_subType_fkey" FOREIGN KEY ("subType") REFERENCES "public"."job_subtypes"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."job_types"("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."password_history"
    ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."profession_requests"
    ADD CONSTRAINT "profession_requests_job_subtype_id_fkey" FOREIGN KEY ("job_subtype_id") REFERENCES "public"."job_subtypes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profession_requests"
    ADD CONSTRAINT "profession_requests_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "public"."job_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profession_requests"
    ADD CONSTRAINT "profession_requests_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profession_requests"
    ADD CONSTRAINT "profession_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_subscription_plans_id_fkey" FOREIGN KEY ("subscription_plans_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."type_creation_requests"
    ADD CONSTRAINT "type_creation_requests_final_subtype_id_fkey" FOREIGN KEY ("final_subtype_id") REFERENCES "public"."job_subtypes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."type_creation_requests"
    ADD CONSTRAINT "type_creation_requests_final_type_id_fkey" FOREIGN KEY ("final_type_id") REFERENCES "public"."job_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."type_creation_requests"
    ADD CONSTRAINT "type_creation_requests_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."type_creation_requests"
    ADD CONSTRAINT "type_creation_requests_selected_type_id_fkey" FOREIGN KEY ("selected_type_id") REFERENCES "public"."job_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."type_creation_requests"
    ADD CONSTRAINT "type_creation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_access_rights"
    ADD CONSTRAINT "user_access_rights_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_access_rights"
    ADD CONSTRAINT "user_access_rights_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_job_types"
    ADD CONSTRAINT "user_job_types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_owned_professions"
    ADD CONSTRAINT "user_owned_professions_job_subtype_id_fkey" FOREIGN KEY ("job_subtype_id") REFERENCES "public"."job_subtypes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_owned_professions"
    ADD CONSTRAINT "user_owned_professions_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "public"."job_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_owned_professions"
    ADD CONSTRAINT "user_owned_professions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_professions"
    ADD CONSTRAINT "user_professions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_security"
    ADD CONSTRAINT "user_security_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Allow delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow insert for authenticated users" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow read access to all authenticated users" ON "public"."comments" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Creator can delete own jobs" ON "public"."jobs" FOR DELETE TO "authenticated", "anon", "service_role" USING (true);



CREATE POLICY "Creator can update own jobs" ON "public"."jobs" FOR UPDATE TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."job_subtypes" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."job_type_subtypes" FOR SELECT USING (true);



CREATE POLICY "Executor can update job status" ON "public"."jobs" FOR UPDATE TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Teas-policy" ON "public"."test-auth" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own jobs" ON "public"."jobs" FOR INSERT TO "authenticated", "anon", "service_role" WITH CHECK (true);



CREATE POLICY "Users can manage their own job types" ON "public"."user_job_types" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own professions" ON "public"."user_professions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read all jobs" ON "public"."jobs" FOR SELECT TO "authenticated", "anon", "service_role" USING (true);



CREATE POLICY "Users can view their own job types" ON "public"."user_job_types" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own professions" ON "public"."user_professions" FOR SELECT TO "authenticated", "anon", "service_role", "authenticator" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_login_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."archived_job_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deny_delete_password_history" ON "public"."password_history" FOR DELETE TO "authenticated", "anon" USING (false);



CREATE POLICY "deny_insert_password_history" ON "public"."password_history" FOR INSERT TO "authenticated", "anon" WITH CHECK (false);



CREATE POLICY "deny_select_password_history" ON "public"."password_history" FOR SELECT TO "authenticated", "anon" USING (false);



CREATE POLICY "deny_update_password_history" ON "public"."password_history" FOR UPDATE TO "authenticated", "anon" USING (false) WITH CHECK (false);



ALTER TABLE "public"."feedback_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_moderation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_subtypes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_type_subtypes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs_moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profession_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registered users policy" ON "public"."job_providers" TO "authenticated", "anon", "service_role", "authenticator" USING (true) WITH CHECK (true);



CREATE POLICY "registered users policy" ON "public"."users" TO "authenticated", "anon", "service_role", "authenticator" USING (true) WITH CHECK (true);



ALTER TABLE "public"."subscription_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plan_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test-auth" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."type_creation_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_access_rights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_can_read_own_security" ON "public"."user_security" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_job_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_owned_professions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_professions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_security" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prune_password_history"("uid" "uuid", "keep_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."prune_password_history"("uid" "uuid", "keep_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."prune_password_history"("uid" "uuid", "keep_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_image_moderation_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_image_moderation_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_image_moderation_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_public_users_email_after_auth_confirm"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_public_users_email_after_auth_confirm"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_public_users_email_after_auth_confirm"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_public_users_email_after_confirm_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_public_users_email_after_confirm_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_public_users_email_after_confirm_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_invites" TO "anon";
GRANT ALL ON TABLE "public"."admin_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_invites" TO "service_role";



GRANT ALL ON TABLE "public"."admin_login_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_login_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_login_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admin_login_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."admin_login_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admin_login_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."app_sessions" TO "anon";
GRANT ALL ON TABLE "public"."app_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."app_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."archived_job_references" TO "anon";
GRANT ALL ON TABLE "public"."archived_job_references" TO "authenticated";
GRANT ALL ON TABLE "public"."archived_job_references" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contact_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contact_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contact_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_transactions" TO "anon";
GRANT ALL ON TABLE "public"."coupon_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_requests" TO "anon";
GRANT ALL ON TABLE "public"."feedback_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_requests" TO "service_role";



GRANT ALL ON TABLE "public"."image_moderation" TO "anon";
GRANT ALL ON TABLE "public"."image_moderation" TO "authenticated";
GRANT ALL ON TABLE "public"."image_moderation" TO "service_role";



GRANT ALL ON TABLE "public"."job_comments" TO "anon";
GRANT ALL ON TABLE "public"."job_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."job_comments" TO "service_role";



GRANT ALL ON TABLE "public"."job_deals" TO "anon";
GRANT ALL ON TABLE "public"."job_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."job_deals" TO "service_role";



GRANT ALL ON TABLE "public"."job_providers" TO "anon";
GRANT ALL ON TABLE "public"."job_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."job_providers" TO "service_role";



GRANT ALL ON TABLE "public"."job_subtypes" TO "anon";
GRANT ALL ON TABLE "public"."job_subtypes" TO "authenticated";
GRANT ALL ON TABLE "public"."job_subtypes" TO "service_role";



GRANT ALL ON TABLE "public"."job_type_subtypes" TO "anon";
GRANT ALL ON TABLE "public"."job_type_subtypes" TO "authenticated";
GRANT ALL ON TABLE "public"."job_type_subtypes" TO "service_role";



GRANT ALL ON TABLE "public"."job_types" TO "anon";
GRANT ALL ON TABLE "public"."job_types" TO "authenticated";
GRANT ALL ON TABLE "public"."job_types" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."jobs_moderation_actions" TO "anon";
GRANT ALL ON TABLE "public"."jobs_moderation_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs_moderation_actions" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."password_history" TO "anon";
GRANT ALL ON TABLE "public"."password_history" TO "authenticated";
GRANT ALL ON TABLE "public"."password_history" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profession_requests" TO "anon";
GRANT ALL ON TABLE "public"."profession_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."profession_requests" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_payments" TO "anon";
GRANT ALL ON TABLE "public"."subscription_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_payments" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plan_changes" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plan_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plan_changes" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."test-auth" TO "anon";
GRANT ALL ON TABLE "public"."test-auth" TO "authenticated";
GRANT ALL ON TABLE "public"."test-auth" TO "service_role";



GRANT ALL ON SEQUENCE "public"."test-auth_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test-auth_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test-auth_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."type_creation_requests" TO "anon";
GRANT ALL ON TABLE "public"."type_creation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."type_creation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."user_access_rights" TO "anon";
GRANT ALL ON TABLE "public"."user_access_rights" TO "authenticated";
GRANT ALL ON TABLE "public"."user_access_rights" TO "service_role";



GRANT ALL ON TABLE "public"."user_devices" TO "anon";
GRANT ALL ON TABLE "public"."user_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."user_devices" TO "service_role";



GRANT ALL ON TABLE "public"."user_job_types" TO "anon";
GRANT ALL ON TABLE "public"."user_job_types" TO "authenticated";
GRANT ALL ON TABLE "public"."user_job_types" TO "service_role";



GRANT ALL ON TABLE "public"."user_owned_professions" TO "anon";
GRANT ALL ON TABLE "public"."user_owned_professions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_owned_professions" TO "service_role";



GRANT ALL ON TABLE "public"."user_professions" TO "anon";
GRANT ALL ON TABLE "public"."user_professions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_professions" TO "service_role";



GRANT ALL ON TABLE "public"."user_security" TO "anon";
GRANT ALL ON TABLE "public"."user_security" TO "authenticated";
GRANT ALL ON TABLE "public"."user_security" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_security_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_security_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_security_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































