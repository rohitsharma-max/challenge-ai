-- AlterTable
ALTER TABLE "users"
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "email_otp_hash" TEXT,
ADD COLUMN "email_otp_expires_at" TIMESTAMP(3),
ADD COLUMN "email_otp_requested_at" TIMESTAMP(3);
