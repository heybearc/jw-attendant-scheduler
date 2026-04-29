-- Add verification mode to count sessions for future dual-entry workflows
ALTER TABLE "count_sessions"
ADD COLUMN "verificationMode" TEXT NOT NULL DEFAULT 'single';

-- Add explicit per-session per-position assignees
CREATE TABLE "count_session_position_assignees" (
  "id" TEXT NOT NULL,
  "countSessionId" TEXT NOT NULL,
  "positionId" TEXT NOT NULL,
  "volunteerId" TEXT NOT NULL,
  "isSuggested" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "count_session_position_assignees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "count_session_position_assignees_countSessionId_positionId_volu_key"
ON "count_session_position_assignees"("countSessionId", "positionId", "volunteerId");

CREATE INDEX "count_session_position_assignees_countSessionId_positionId_idx"
ON "count_session_position_assignees"("countSessionId", "positionId");

CREATE INDEX "count_session_position_assignees_volunteerId_idx"
ON "count_session_position_assignees"("volunteerId");

ALTER TABLE "count_session_position_assignees"
ADD CONSTRAINT "count_session_position_assignees_countSessionId_fkey"
FOREIGN KEY ("countSessionId") REFERENCES "count_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_session_position_assignees"
ADD CONSTRAINT "count_session_position_assignees_positionId_fkey"
FOREIGN KEY ("positionId") REFERENCES "positions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_session_position_assignees"
ADD CONSTRAINT "count_session_position_assignees_volunteerId_fkey"
FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_session_position_assignees"
ADD CONSTRAINT "count_session_position_assignees_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
