-- Ensure UUID generation function exists for default IDs.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Token role separation for ADMIN vs HEAD_ADMIN login tokens.
ALTER TABLE "TokenAdmin"
ADD COLUMN "tokenRole" "RoleAdmin" NOT NULL DEFAULT 'ADMIN';

-- Make Admin ID auto-generated at DB level.
ALTER TABLE "Admin"
ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
