-- CreateTable
CREATE TABLE `settings` (
    `userId` VARCHAR(191) NOT NULL,
    `sortBy` VARCHAR(50) NOT NULL DEFAULT 'creationTime',
    `sortOrder` VARCHAR(10) NOT NULL DEFAULT 'asc',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
