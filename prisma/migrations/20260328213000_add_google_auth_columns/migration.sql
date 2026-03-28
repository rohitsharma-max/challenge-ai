-- Allow OAuth-only users to exist without a password
ALTER TABLE "users"
ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add Google OAuth fields expected by the Prisma schema
ALTER TABLE "users"
ADD COLUMN "google_id" TEXT,
ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'email';

-- Match Prisma's unique constraint for linked Google accounts
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
