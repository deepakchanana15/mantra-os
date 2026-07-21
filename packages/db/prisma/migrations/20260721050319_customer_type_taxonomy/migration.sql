-- AlterEnum
-- Replace the generic INDIVIDUAL/COMPANY CustomerType with the sports-business
-- taxonomy in DECISIONS.md "Customer type taxonomy". Existing rows are
-- remapped (INDIVIDUAL -> USER, COMPANY -> STORE) via an intermediate `text`
-- cast: neither the old nor new enum type can hold both the old and new
-- values at once, so the column must pass through `text` (which accepts
-- anything) while the remap happens, then get cast to the new enum only
-- once every row already holds a value that enum actually contains.
BEGIN;
CREATE TYPE "CustomerType_new" AS ENUM ('USER', 'STORE', 'ACADEMY', 'CLUB', 'COACH', 'PROFESSIONAL', 'SCHOOL', 'COLLEGE_UNIVERSITY', 'ASSOCIATION', 'CORPORATE', 'GOVERNMENT', 'TEAM', 'DISTRIBUTOR', 'DEALER', 'FRANCHISE', 'EVENT_ORGANIZER', 'RENTAL_PROVIDER', 'NGO_FOUNDATION', 'INFLUENCER_CREATOR', 'OEM_PRIVATE_LABEL');
ALTER TABLE "customers" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "customers" ALTER COLUMN "type" TYPE TEXT USING "type"::text;
UPDATE "customers" SET "type" = 'USER' WHERE "type" = 'INDIVIDUAL';
UPDATE "customers" SET "type" = 'STORE' WHERE "type" = 'COMPANY';
ALTER TABLE "customers" ALTER COLUMN "type" TYPE "CustomerType_new" USING "type"::"CustomerType_new";
DROP TYPE "CustomerType";
ALTER TYPE "CustomerType_new" RENAME TO "CustomerType";
ALTER TABLE "customers" ALTER COLUMN "type" SET DEFAULT 'USER';
COMMIT;
