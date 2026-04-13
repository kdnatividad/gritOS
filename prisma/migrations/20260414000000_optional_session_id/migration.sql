-- Make sessionId optional (nullable) on SetLog so sets can be logged without a session
ALTER TABLE "SetLog" ALTER COLUMN "sessionId" DROP NOT NULL;
