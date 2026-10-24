-- AlterTable
ALTER TABLE "OTP" ADD COLUMN     "payload" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'AUTH';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hostVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "idCardPhoto" TEXT;

-- CreateIndex
CREATE INDEX "OTP_type_idx" ON "OTP"("type");
