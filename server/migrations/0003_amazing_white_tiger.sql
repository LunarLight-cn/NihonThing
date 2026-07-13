CREATE TABLE `Product_Name_History` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`old_name` text NOT NULL,
	`new_name` text NOT NULL,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`product_id`) REFERENCES `Products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`name_en` text NOT NULL,
	`name_th` text,
	`name_jp` text,
	`desc_en` text,
	`desc_th` text,
	`desc_jp` text,
	`brand_id` integer,
	`origin_country_id` integer,
	`price_tentative_jpy` real,
	`price_tentative_thb` real,
	`img` text,
	`tag` text,
	`amount` integer DEFAULT 0,
	`weight` real DEFAULT 0,
	`remain` integer DEFAULT 0,
	`status` text,
	`total_sold` integer DEFAULT 0,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text,
	FOREIGN KEY (`category_id`) REFERENCES `Categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`brand_id`) REFERENCES `Brands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`origin_country_id`) REFERENCES `Countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Products`("id", "category_id", "name_en", "name_th", "name_jp", "desc_en", "desc_th", "desc_jp", "brand_id", "origin_country_id", "price_tentative_jpy", "price_tentative_thb", "img", "tag", "amount", "weight", "remain", "status", "total_sold", "cdate", "udate") SELECT "id", "category_id", "name_en", "name_th", "name_jp", "desc_en", "desc_th", "desc_jp", "brand_id", "origin_country_id", "price_tentative_jpy", "price_tentative_thb", "img", "tag", "amount", "weight", "remain", "status", "total_sold", "cdate", "udate" FROM `Products`;--> statement-breakpoint
DROP TABLE `Products`;--> statement-breakpoint
ALTER TABLE `__new_Products` RENAME TO `Products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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