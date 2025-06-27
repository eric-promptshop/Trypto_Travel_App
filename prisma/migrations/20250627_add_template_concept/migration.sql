-- Add isTemplate field to distinguish templates from tour instances
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN DEFAULT FALSE;

-- Add templateId to link tour instances to their templates
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "templateId" TEXT;

-- Add foreign key constraint for templateId
ALTER TABLE "tours" ADD CONSTRAINT "tours_templateId_fkey" 
  FOREIGN KEY ("templateId") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on templateId for performance
CREATE INDEX IF NOT EXISTS "tours_templateId_idx" ON "tours"("templateId");

-- Create index on isTemplate for filtering
CREATE INDEX IF NOT EXISTS "tours_isTemplate_idx" ON "tours"("isTemplate");

-- Update existing tours to be templates (not instances)
UPDATE "tours" SET "isTemplate" = TRUE WHERE "templateId" IS NULL;