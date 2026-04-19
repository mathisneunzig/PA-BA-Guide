/*
  Warnings:

  - You are about to alter the column `programmiersprachen` on the `books` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `books` MODIFY `programmiersprachen` VARCHAR(191) NULL,
    MODIFY `hauptkategorie` VARCHAR(191) NULL,
    MODIFY `regalnummer` VARCHAR(191) NULL;
