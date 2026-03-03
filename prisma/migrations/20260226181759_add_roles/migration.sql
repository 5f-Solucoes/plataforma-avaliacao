-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'INSTRUCTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
