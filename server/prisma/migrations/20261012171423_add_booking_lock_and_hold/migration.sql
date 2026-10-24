-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'HOLD';
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "holdExpiresAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'HOLD';

-- CreateIndex
CREATE INDEX "Booking_propertyId_status_idx" ON "Booking"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Booking_propertyId_checkIn_checkOut_idx" ON "Booking"("propertyId", "checkIn", "checkOut");
