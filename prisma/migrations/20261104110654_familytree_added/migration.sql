/*
  Warnings:

  - You are about to drop the column `userId` on the `Person` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[familyTreeId,id]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[familyTreeId,parentId,childId,kind]` on the table `ParentChild` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[familyTreeId,id]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `familyTreeId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyTreeId` to the `EventParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyTreeId` to the `ParentChild` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyTreeId` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyTreeId` to the `Union` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FamilyTreeRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "EventParticipant" DROP CONSTRAINT "EventParticipant_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventParticipant" DROP CONSTRAINT "EventParticipant_personId_fkey";

-- DropForeignKey
ALTER TABLE "ParentChild" DROP CONSTRAINT "ParentChild_childId_fkey";

-- DropForeignKey
ALTER TABLE "ParentChild" DROP CONSTRAINT "ParentChild_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Person" DROP CONSTRAINT "Person_userId_fkey";

-- DropForeignKey
ALTER TABLE "Union" DROP CONSTRAINT "Union_personAId_fkey";

-- DropForeignKey
ALTER TABLE "Union" DROP CONSTRAINT "Union_personBId_fkey";

-- DropIndex
DROP INDEX "EventParticipant_personId_idx";

-- DropIndex
DROP INDEX "ParentChild_childId_idx";

-- DropIndex
DROP INDEX "ParentChild_parentId_childId_kind_key";

-- DropIndex
DROP INDEX "Person_userId_idx";

-- DropIndex
DROP INDEX "Union_personAId_idx";

-- DropIndex
DROP INDEX "Union_personBId_idx";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "familyTreeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EventParticipant" ADD COLUMN     "familyTreeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ParentChild" ADD COLUMN     "familyTreeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "userId",
ADD COLUMN     "familyTreeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Union" ADD COLUMN     "familyTreeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FamilyTree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyTreeMembership" (
    "familyTreeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FamilyTreeRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyTreeMembership_pkey" PRIMARY KEY ("familyTreeId","userId")
);

-- CreateIndex
CREATE INDEX "FamilyTree_ownerId_idx" ON "FamilyTree"("ownerId");

-- CreateIndex
CREATE INDEX "FamilyTreeMembership_userId_createdAt_idx" ON "FamilyTreeMembership"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_familyTreeId_id_key" ON "Event"("familyTreeId", "id");

-- CreateIndex
CREATE INDEX "EventParticipant_familyTreeId_personId_idx" ON "EventParticipant"("familyTreeId", "personId");

-- CreateIndex
CREATE INDEX "EventParticipant_familyTreeId_eventId_idx" ON "EventParticipant"("familyTreeId", "eventId");

-- CreateIndex
CREATE INDEX "ParentChild_familyTreeId_childId_idx" ON "ParentChild"("familyTreeId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_familyTreeId_parentId_childId_kind_key" ON "ParentChild"("familyTreeId", "parentId", "childId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Person_familyTreeId_id_key" ON "Person"("familyTreeId", "id");

-- CreateIndex
CREATE INDEX "Union_familyTreeId_personAId_idx" ON "Union"("familyTreeId", "personAId");

-- CreateIndex
CREATE INDEX "Union_familyTreeId_personBId_idx" ON "Union"("familyTreeId", "personBId");

-- AddForeignKey
ALTER TABLE "FamilyTree" ADD CONSTRAINT "FamilyTree_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTreeMembership" ADD CONSTRAINT "FamilyTreeMembership_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyTreeMembership" ADD CONSTRAINT "FamilyTreeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_familyTreeId_eventId_fkey" FOREIGN KEY ("familyTreeId", "eventId") REFERENCES "Event"("familyTreeId", "id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_familyTreeId_personId_fkey" FOREIGN KEY ("familyTreeId", "personId") REFERENCES "Person"("familyTreeId", "id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_familyTreeId_parentId_fkey" FOREIGN KEY ("familyTreeId", "parentId") REFERENCES "Person"("familyTreeId", "id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_familyTreeId_childId_fkey" FOREIGN KEY ("familyTreeId", "childId") REFERENCES "Person"("familyTreeId", "id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_familyTreeId_personAId_fkey" FOREIGN KEY ("familyTreeId", "personAId") REFERENCES "Person"("familyTreeId", "id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_familyTreeId_personBId_fkey" FOREIGN KEY ("familyTreeId", "personBId") REFERENCES "Person"("familyTreeId", "id") ON DELETE CASCADE ON UPDATE NO ACTION;
