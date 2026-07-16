CREATE TABLE `Settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`per_user_item_limit` integer DEFAULT 50,
	`trip_cutoff_days` integer DEFAULT 5,
	`weight_tolerance_kg` real DEFAULT 5,
	`price_tolerance_thb` real DEFAULT 500,
	`udate` text
);
--> statement-breakpoint
ALTER TABLE `Ships` ADD `max_items` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `Ships` ADD `current_items` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `Ships` ADD `max_price` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `Ships` ADD `current_price` real DEFAULT 0;