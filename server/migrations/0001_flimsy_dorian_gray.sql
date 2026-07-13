PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Ships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`ship_date` text NOT NULL,
	`track_no` text,
	`ship_price` real,
	`courier_name` text,
	`origin_id` integer NOT NULL,
	`destination_id` integer NOT NULL,
	`max_cap` real DEFAULT 0,
	`current_cap` real DEFAULT 0,
	`close_date` text,
	`status` text DEFAULT 'open',
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text,
	FOREIGN KEY (`origin_id`) REFERENCES `Countries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_id`) REFERENCES `Countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Ships`("id", "type", "ship_date", "track_no", "ship_price", "courier_name", "origin_id", "destination_id", "max_cap", "current_cap", "close_date", "status", "cdate", "udate") SELECT "id", "type", "ship_date", "track_no", "ship_price", "courier_name", "origin_id", "destination_id", "max_cap", "current_cap", "close_date", "status", "cdate", "udate" FROM `Ships`;--> statement-breakpoint
DROP TABLE `Ships`;--> statement-breakpoint
ALTER TABLE `__new_Ships` RENAME TO `Ships`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `Products` ADD `weight` real DEFAULT 0;