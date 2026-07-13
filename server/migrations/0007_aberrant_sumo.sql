PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`birth_date` text,
	`gender` text,
	`role` text DEFAULT 'client',
	`status` text DEFAULT 'active',
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text
);
--> statement-breakpoint
INSERT INTO `__new_Users`("id", "username", "email", "password_hash", "birth_date", "gender", "role", "status", "cdate", "udate") SELECT "id", "username", "email", "password_hash", "birth_date", "gender", "role", "status", "cdate", "udate" FROM `Users`;--> statement-breakpoint
DROP TABLE `Users`;--> statement-breakpoint
ALTER TABLE `__new_Users` RENAME TO `Users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `Users_email_unique` ON `Users` (`email`);