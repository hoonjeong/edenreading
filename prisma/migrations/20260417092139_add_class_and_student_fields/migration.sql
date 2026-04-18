-- AlterTable
ALTER TABLE `students` ADD COLUMN `classNo` VARCHAR(191) NULL,
    ADD COLUMN `enrollDate` DATETIME(3) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `homePhone` VARCHAR(191) NULL,
    ADD COLUMN `isOnLeave` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `leaveReason` VARCHAR(191) NULL,
    ADD COLUMN `memo` TEXT NULL,
    ADD COLUMN `school` VARCHAR(191) NULL,
    ADD COLUMN `siblingInfo` VARCHAR(191) NULL,
    ADD COLUMN `studentCode` VARCHAR(191) NULL,
    ADD COLUMN `studentPhone` VARCHAR(191) NULL,
    ADD COLUMN `withdrawDate` DATETIME(3) NULL,
    ADD COLUMN `withdrawReason` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `fee` INTEGER NOT NULL DEFAULT 0,
    `feePerSession` INTEGER NULL,
    `targetGrade` VARCHAR(191) NULL,
    `teacher` VARCHAR(191) NULL,
    `assistantTeacher` VARCHAR(191) NULL,
    `classroom` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PAUSED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `classes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_students` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `class_students_classId_studentId_key`(`classId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
