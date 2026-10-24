-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateIndex
CREATE INDEX "Property_reviewedById_idx" ON "Property"("reviewedById");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
