-- CreateTable
CREATE TABLE "global_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(6),
    "endDate" TIMESTAMP(6),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "global_announcements_isactive_idx" ON "global_announcements"("isActive");
CREATE INDEX "global_announcements_startdate_idx" ON "global_announcements"("startDate");
CREATE INDEX "global_announcements_enddate_idx" ON "global_announcements"("endDate");

-- AddForeignKey
ALTER TABLE "global_announcements" ADD CONSTRAINT "global_announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
