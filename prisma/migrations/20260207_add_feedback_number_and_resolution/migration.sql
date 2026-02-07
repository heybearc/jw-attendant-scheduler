-- Add feedbackNumber and resolutionComment to feedback table
ALTER TABLE "feedback" ADD COLUMN "feedbackNumber" TEXT;
ALTER TABLE "feedback" ADD COLUMN "resolutionComment" TEXT;

-- Create unique index on feedbackNumber
CREATE UNIQUE INDEX "feedback_feedbackNumber_key" ON "feedback"("feedbackNumber");

-- Generate feedback numbers for existing records
DO $$
DECLARE
  rec RECORD;
  counter INTEGER := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM feedback ORDER BY "createdAt" ASC
  LOOP
    UPDATE feedback 
    SET "feedbackNumber" = 'FB-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;
