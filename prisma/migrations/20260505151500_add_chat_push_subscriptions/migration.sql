-- Add chat push subscription storage (Web Push)

CREATE TABLE IF NOT EXISTS "event_chat_push_subscriptions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "volunteer_id" TEXT,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "user_agent" TEXT,
  "last_seen_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_chat_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_chat_push_subscriptions_endpoint_key" ON "event_chat_push_subscriptions"("endpoint");
CREATE INDEX IF NOT EXISTS "event_chat_push_subscriptions_user_id_idx" ON "event_chat_push_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "event_chat_push_subscriptions_volunteer_id_idx" ON "event_chat_push_subscriptions"("volunteer_id");

ALTER TABLE "event_chat_push_subscriptions"
  ADD CONSTRAINT "event_chat_push_subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_chat_push_subscriptions"
  ADD CONSTRAINT "event_chat_push_subscriptions_volunteer_id_fkey"
  FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

