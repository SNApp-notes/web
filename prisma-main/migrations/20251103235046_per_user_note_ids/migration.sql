-- Per-User Note ID Migration
-- This migration transforms global note IDs to per-user sequential IDs

-- Step 1: Add temporary noteId column with default value
ALTER TABLE `note` ADD COLUMN `noteId` INT NOT NULL DEFAULT 0;

-- Step 2: Populate noteId with per-user sequential numbers based on creation order
-- Use a subquery with ROW_NUMBER() equivalent using variables
SET @row_num := 0;
SET @prev_user := '';

UPDATE `note` n
JOIN (
  SELECT 
    id,
    userId,
    @row_num := IF(@prev_user = userId, @row_num + 1, 1) as rn,
    @prev_user := userId
  FROM `note`
  ORDER BY userId, createdAt, id
) ranked ON n.id = ranked.id
SET n.noteId = ranked.rn;

-- Step 3: Remove AUTO_INCREMENT from id column first
ALTER TABLE `note` MODIFY COLUMN `id` INT NOT NULL;

-- Step 4: Drop the old primary key
ALTER TABLE `note` DROP PRIMARY KEY;

-- Step 5: Drop the old id column
ALTER TABLE `note` DROP COLUMN `id`;

-- Step 6: Remove the default from noteId (we'll handle ID generation in application code)
ALTER TABLE `note` ALTER COLUMN `noteId` DROP DEFAULT;

-- Step 7: Create the compound primary key
ALTER TABLE `note` ADD PRIMARY KEY (`noteId`, `userId`);

-- Step 8: Ensure the userId index is still present (it should be)
-- This is redundant as Prisma will handle indexes, but included for completeness
ALTER TABLE `note` ADD INDEX IF NOT EXISTS `note_userId_idx` (`userId`);
