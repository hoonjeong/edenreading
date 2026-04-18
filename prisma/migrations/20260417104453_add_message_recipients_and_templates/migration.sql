-- AlterTable
ALTER TABLE `messages` ADD COLUMN `failCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `msgType` ENUM('SMS', 'LMS', 'MMS') NOT NULL DEFAULT 'SMS',
    ADD COLUMN `recipientCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `resultCode` VARCHAR(191) NULL,
    ADD COLUMN `resultMessage` VARCHAR(191) NULL,
    ADD COLUMN `senderPhone` VARCHAR(191) NULL,
    ADD COLUMN `successCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `testMode` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `message_recipients` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `isSuccess` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `message_recipients_messageId_idx`(`messageId`),
    INDEX `message_recipients_phone_createdAt_idx`(`phone`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_templates` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `message_templates_adminId_updatedAt_idx`(`adminId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `messages_adminId_sentAt_idx` ON `messages`(`adminId`, `sentAt`);

-- AddForeignKey
ALTER TABLE `message_recipients` ADD CONSTRAINT `message_recipients_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_templates` ADD CONSTRAINT `message_templates_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
