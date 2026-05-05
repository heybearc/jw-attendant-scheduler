-- Chat MVP schema (Increment 1)
-- Event-scoped channels for staff and magic-link volunteers

CREATE TYPE "ChatChannelType" AS ENUM ('EVENT_ANNOUNCEMENTS', 'EVENT_GENERAL', 'POSITION');
CREATE TYPE "ChatMemberRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');
CREATE TYPE "ChatMessageKind" AS ENUM ('TEXT', 'SYSTEM');

CREATE TABLE "event_chat_channels" (
  "id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "type" "ChatChannelType" NOT NULL,
  "name" TEXT NOT NULL,
  "position_id" TEXT,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_chat_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_chat_members" (
  "id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "user_id" TEXT,
  "volunteer_id" TEXT,
  "role" "ChatMemberRole" NOT NULL DEFAULT 'MEMBER',
  "muted_until" TIMESTAMP(3),
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_chat_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_chat_messages" (
  "id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "sender_user_id" TEXT,
  "sender_volunteer_id" TEXT,
  "kind" "ChatMessageKind" NOT NULL DEFAULT 'TEXT',
  "body" TEXT NOT NULL,
  "edited_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_chat_reads" (
  "id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "user_id" TEXT,
  "volunteer_id" TEXT,
  "last_read_message_id" TEXT,
  "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_chat_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_chat_channels_event_id_type_position_id_key"
ON "event_chat_channels"("event_id", "type", "position_id");

CREATE INDEX "event_chat_channels_event_id_is_archived_idx"
ON "event_chat_channels"("event_id", "is_archived");

CREATE INDEX "event_chat_channels_position_id_idx"
ON "event_chat_channels"("position_id");

CREATE UNIQUE INDEX "event_chat_members_channel_id_user_id_key"
ON "event_chat_members"("channel_id", "user_id");

CREATE UNIQUE INDEX "event_chat_members_channel_id_volunteer_id_key"
ON "event_chat_members"("channel_id", "volunteer_id");

CREATE INDEX "event_chat_members_channel_id_idx"
ON "event_chat_members"("channel_id");

CREATE INDEX "event_chat_members_user_id_idx"
ON "event_chat_members"("user_id");

CREATE INDEX "event_chat_members_volunteer_id_idx"
ON "event_chat_members"("volunteer_id");

CREATE INDEX "event_chat_messages_channel_id_created_at_idx"
ON "event_chat_messages"("channel_id", "created_at");

CREATE INDEX "event_chat_messages_sender_user_id_idx"
ON "event_chat_messages"("sender_user_id");

CREATE INDEX "event_chat_messages_sender_volunteer_id_idx"
ON "event_chat_messages"("sender_volunteer_id");

CREATE UNIQUE INDEX "event_chat_reads_channel_id_user_id_key"
ON "event_chat_reads"("channel_id", "user_id");

CREATE UNIQUE INDEX "event_chat_reads_channel_id_volunteer_id_key"
ON "event_chat_reads"("channel_id", "volunteer_id");

CREATE INDEX "event_chat_reads_channel_id_idx"
ON "event_chat_reads"("channel_id");

ALTER TABLE "event_chat_channels"
  ADD CONSTRAINT "event_chat_channels_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_members"
  ADD CONSTRAINT "event_chat_members_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "event_chat_channels"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_members"
  ADD CONSTRAINT "event_chat_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_members"
  ADD CONSTRAINT "event_chat_members_volunteer_id_fkey"
  FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_messages"
  ADD CONSTRAINT "event_chat_messages_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "event_chat_channels"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_messages"
  ADD CONSTRAINT "event_chat_messages_sender_user_id_fkey"
  FOREIGN KEY ("sender_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_chat_messages"
  ADD CONSTRAINT "event_chat_messages_sender_volunteer_id_fkey"
  FOREIGN KEY ("sender_volunteer_id") REFERENCES "volunteers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_chat_reads"
  ADD CONSTRAINT "event_chat_reads_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "event_chat_channels"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_reads"
  ADD CONSTRAINT "event_chat_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_reads"
  ADD CONSTRAINT "event_chat_reads_volunteer_id_fkey"
  FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
