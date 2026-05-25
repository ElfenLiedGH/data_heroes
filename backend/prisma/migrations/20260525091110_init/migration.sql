-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('transactional', 'marketing');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('email', 'sms', 'push', 'messenger');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EU', 'US', 'RU', 'GLOBAL');

-- CreateEnum
CREATE TYPE "PolicyAction" AS ENUM ('deny');

-- CreateEnum
CREATE TYPE "DecisionReason" AS ENUM ('allowed', 'blocked_by_global_policy', 'disabled_by_user_preference', 'disabled_by_default', 'blocked_by_quiet_hours');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "PreferenceSource" AS ENUM ('default', 'user');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default_preferences" (
    "id" TEXT NOT NULL,
    "region" "Region",
    "notification_type" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "source" "PreferenceSource" NOT NULL DEFAULT 'default',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiet_hours" (
    "user_id" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quiet_hours_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "global_policies" (
    "id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "region" "Region" NOT NULL,
    "action" "PolicyAction" NOT NULL,
    "reason_code" "DecisionReason" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "region" "Region" NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL,
    "decision" "Decision" NOT NULL,
    "reason" "DecisionReason" NOT NULL,
    "global_policy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "default_preferences_region_idx" ON "default_preferences"("region");

-- CreateIndex
CREATE UNIQUE INDEX "default_preferences_global_unique" ON "default_preferences"("notification_type", "channel") WHERE "region" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "default_preferences_region_unique" ON "default_preferences"("notification_type", "channel", "region") WHERE "region" IS NOT NULL;

-- CreateIndex
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_notification_type_channel_key" ON "user_preferences"("user_id", "notification_type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "global_policies_notification_type_channel_region_key" ON "global_policies"("notification_type", "channel", "region");

-- CreateIndex
CREATE INDEX "evaluation_logs_user_id_idx" ON "evaluation_logs"("user_id");

-- CreateIndex
CREATE INDEX "evaluation_logs_global_policy_id_idx" ON "evaluation_logs"("global_policy_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiet_hours" ADD CONSTRAINT "user_quiet_hours_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_logs" ADD CONSTRAINT "evaluation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_logs" ADD CONSTRAINT "evaluation_logs_global_policy_id_fkey" FOREIGN KEY ("global_policy_id") REFERENCES "global_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
