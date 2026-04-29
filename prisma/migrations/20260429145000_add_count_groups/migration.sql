CREATE TABLE "count_session_groups" (
  "id" TEXT NOT NULL,
  "countSessionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "primaryVolunteerId" TEXT,
  "secondaryVolunteerId" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "count_session_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "count_session_group_positions" (
  "id" TEXT NOT NULL,
  "countSessionId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "positionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "count_session_group_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "count_group_entries" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "attendeeCount" INTEGER,
  "notes" TEXT,
  "enteredBy" TEXT,
  "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "count_group_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "count_session_group_positions_countSessionId_positionId_key"
ON "count_session_group_positions"("countSessionId", "positionId");

CREATE UNIQUE INDEX "count_session_group_positions_groupId_positionId_key"
ON "count_session_group_positions"("groupId", "positionId");

CREATE UNIQUE INDEX "count_group_entries_groupId_key"
ON "count_group_entries"("groupId");

CREATE INDEX "count_session_groups_countSessionId_idx"
ON "count_session_groups"("countSessionId");

CREATE INDEX "count_session_group_positions_countSessionId_groupId_idx"
ON "count_session_group_positions"("countSessionId", "groupId");

ALTER TABLE "count_session_groups"
ADD CONSTRAINT "count_session_groups_countSessionId_fkey"
FOREIGN KEY ("countSessionId") REFERENCES "count_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_session_groups"
ADD CONSTRAINT "count_session_groups_primaryVolunteerId_fkey"
FOREIGN KEY ("primaryVolunteerId") REFERENCES "volunteers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "count_session_groups"
ADD CONSTRAINT "count_session_groups_secondaryVolunteerId_fkey"
FOREIGN KEY ("secondaryVolunteerId") REFERENCES "volunteers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "count_session_groups"
ADD CONSTRAINT "count_session_groups_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "count_session_group_positions"
ADD CONSTRAINT "count_session_group_positions_countSessionId_fkey"
FOREIGN KEY ("countSessionId") REFERENCES "count_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_session_group_positions"
ADD CONSTRAINT "count_session_group_positions_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "count_session_groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_session_group_positions"
ADD CONSTRAINT "count_session_group_positions_positionId_fkey"
FOREIGN KEY ("positionId") REFERENCES "positions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_group_entries"
ADD CONSTRAINT "count_group_entries_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "count_session_groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "count_group_entries"
ADD CONSTRAINT "count_group_entries_enteredBy_fkey"
FOREIGN KEY ("enteredBy") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
