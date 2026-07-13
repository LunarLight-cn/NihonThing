CREATE TABLE `Product_Name_History` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`old_name` text NOT NULL,
	`new_name` text NOT NULL,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`product_id`) REFERENCES `Products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Products` DROP COLUMN `brand`;--> statement-breakpoint
CREATE TABLE `__new_Purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_item_id` integer,
	`product_id` integer,
	`agent_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`actual_cost_jpy` real NOT NULL,
	`actual_cost_thb` real NOT NULL,
	`shop_name` text,
	`receipt_img` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`order_item_id`) REFERENCES `Order_Items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `Products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Purchases`("id", "order_item_id", "product_id", "agent_id", "quantity", "actual_cost_jpy", "actual_cost_thb", "shop_name", "receipt_img", "cdate") SELECT "id", "order_item_id", "product_id", "agent_id", "quantity", "actual_cost_jpy", "actual_cost_thb", "shop_name", "receipt_img", "cdate" FROM `Purchases`;--> statement-breakpoint
DROP TABLE `Purchases`;--> statement-breakpoint
ALTER TABLE `__new_Purchases` RENAME TO `Purchases`;