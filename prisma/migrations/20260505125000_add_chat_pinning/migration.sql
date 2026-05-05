-- Add pinned_message_id to event_chat_channels for per-channel pinned message

ALTER TABLE "event_chat_channels"
ADD COLUMN IF NOT EXISTS "pinned_message_id" uuid NULL;

ALTER TABLE "event_chat_channels"
ADD CONSTRAINT "event_chat_channels_pinned_message_id_fkey"
FOREIGN KEY ("pinned_message_id") REFERENCES "event_chat_messages"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

