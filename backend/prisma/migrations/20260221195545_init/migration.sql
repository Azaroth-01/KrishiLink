-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'DISTRIBUTOR', 'RETAILER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProduceStatus" AS ENUM ('LISTED', 'IN_ESCROW', 'DELIVERED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "name" TEXT,
    "state" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produce" (
    "id" TEXT NOT NULL,
    "tokenId" INTEGER,
    "name" TEXT NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "ipfsHash" TEXT,
    "status" "ProduceStatus" NOT NULL DEFAULT 'LISTED',
    "mspComparison" BOOLEAN NOT NULL DEFAULT true,
    "farmerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinimumSupportPrice" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinimumSupportPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Produce_tokenId_key" ON "Produce"("tokenId");

-- AddForeignKey
ALTER TABLE "Produce" ADD CONSTRAINT "Produce_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
