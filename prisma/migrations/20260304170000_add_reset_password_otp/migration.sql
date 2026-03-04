-- AlterTable
ALTER TABLE "users"
ADD COLUMN "reset_password_otp_hash" TEXT,
ADD COLUMN "reset_password_otp_expires_at" TIMESTAMP(3),
ADD COLUMN "reset_password_otp_requested_at" TIMESTAMP(3);
