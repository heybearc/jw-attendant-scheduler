-- Fix: event_chat_messages.id is TEXT (not UUID) so pinned_message_id must be TEXT

ALTER TABLE "event_chat_channels"
DROP CONSTRAINT IF EXISTS "event_chat_channels_pinned_message_id_fkey";

ALTER TABLE "event_chat_channels"
ALTER COLUMN "pinned_message_id" TYPE TEXT USING "pinned_message_id"::text;

ALTER TABLE "event_chat_channels"
ADD CONSTRAINT "event_chat_channels_pinned_message_id_fkey"
FOREIGN KEY ("pinned_message_id") REFERENCES "event_chat_messages"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

