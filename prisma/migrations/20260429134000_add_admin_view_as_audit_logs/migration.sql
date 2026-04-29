CREATE TABLE "admin_view_as_audit_logs" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "targetVolunteerId" TEXT,
  "eventId" TEXT,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_view_as_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_view_as_audit_logs_adminUserId_createdAt_idx"
ON "admin_view_as_audit_logs"("adminUserId", "createdAt");

CREATE INDEX "admin_view_as_audit_logs_eventId_createdAt_idx"
ON "admin_view_as_audit_logs"("eventId", "createdAt");

ALTER TABLE "admin_view_as_audit_logs"
ADD CONSTRAINT "admin_view_as_audit_logs_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
