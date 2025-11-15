-- Add fulltext index to note content for search functionality
CREATE FULLTEXT INDEX `note_content_idx` ON `note`(`content`);
