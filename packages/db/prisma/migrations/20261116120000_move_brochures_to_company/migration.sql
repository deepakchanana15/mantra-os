-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "brochureUrl" TEXT,
ADD COLUMN     "brochureUrlEn" TEXT;

-- AlterTable
ALTER TABLE "organization_settings" DROP COLUMN "brochureUrlEn",
DROP COLUMN "brochureUrlDe",
DROP COLUMN "brochureUrlNl";
