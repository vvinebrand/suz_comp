/*
  Warnings:

  - You are about to drop the column `middleName` on the `Participant` table. All the data in the column will be lost.
  - Added the required column `abbrev` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "middleName",
ADD COLUMN     "abbrev" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "participant_total" (
    "participantId" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,

    CONSTRAINT "participant_total_pkey" PRIMARY KEY ("participantId")
);

-- CreateTable
CREATE TABLE "team_top3" (
    "institution" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "membersCount" INTEGER NOT NULL,

    CONSTRAINT "team_top3_pkey" PRIMARY KEY ("institution")
);
