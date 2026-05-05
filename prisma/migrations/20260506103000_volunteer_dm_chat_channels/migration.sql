-- Volunteer-to-volunteer direct messages + DM columns

ALTER TYPE "ChatChannelType" ADD VALUE 'VOLUNTEER_DM';

ALTER TABLE "event_chat_channels" ADD COLUMN IF NOT EXISTS "dm_volunteer_a_id" TEXT;
ALTER TABLE "event_chat_channels" ADD COLUMN IF NOT EXISTS "dm_volunteer_b_id" TEXT;
