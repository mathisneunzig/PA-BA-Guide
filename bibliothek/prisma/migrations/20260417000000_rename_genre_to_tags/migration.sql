-- Rename column genre to tags in books table
-- If the column already exists as genre, rename it; if it doesn't exist at all (fresh install), add it.
ALTER TABLE `books` RENAME COLUMN `genre` TO `tags`;
