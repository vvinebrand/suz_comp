/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Participant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "birthYear" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Discipline" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "columns" TEXT NOT NULL,
    "unit" TEXT,
    "gender" TEXT,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "participantId" INTEGER NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "value" TEXT,
    "points" INTEGER,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_key_key" ON "Discipline"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Result_participantId_disciplineId_key" ON "Result"("participantId", "disciplineId");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
