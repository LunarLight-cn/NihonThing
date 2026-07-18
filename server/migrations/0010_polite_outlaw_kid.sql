CREATE TABLE `Login_Attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`cdate` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `Settings` ADD `exchange_rate_jpy_thb` real DEFAULT 0.25;