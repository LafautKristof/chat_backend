/*
  Warnings:

  - Added the required column `isGroup` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "isGroup" BOOLEAN NOT NULL,
ADD COLUMN     "title" TEXT;
