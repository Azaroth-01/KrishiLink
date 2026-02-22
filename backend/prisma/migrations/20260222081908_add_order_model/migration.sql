/*
  Warnings:

  - The values [DISTRIBUTOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ipfsHash` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `mspComparison` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerKg` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `quantityKg` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Produce` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `Produce` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Produce` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'FARMER', 'WHOLESALER', 'RETAILER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FARMER';
COMMIT;

-- DropIndex
DROP INDEX "Produce_tokenId_key";

-- AlterTable
ALTER TABLE "Produce" DROP COLUMN "ipfsHash",
DROP COLUMN "mspComparison",
DROP COLUMN "pricePerKg",
DROP COLUMN "quantityKg",
DROP COLUMN "status",
DROP COLUMN "tokenId",
DROP COLUMN "updatedAt",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rating",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "produceId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_produceId_fkey" FOREIGN KEY ("produceId") REFERENCES "Produce"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
