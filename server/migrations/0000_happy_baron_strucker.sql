CREATE TABLE `Addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text,
	`fullname` text NOT NULL,
	`surname` text NOT NULL,
	`tel` text NOT NULL,
	`address_line` text NOT NULL,
	`subdistrict_id` integer NOT NULL,
	`tag` text,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subdistrict_id`) REFERENCES `Subdistricts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_th` text NOT NULL,
	`name_en` text NOT NULL,
	`name_jp` text,
	`map_location` text
);
--> statement-breakpoint
CREATE TABLE `Categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_th` text NOT NULL,
	`name_en` text NOT NULL,
	`name_jp` text
);
--> statement-breakpoint
CREATE TABLE `Countries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_th` text NOT NULL,
	`name_en` text NOT NULL,
	`name_jp` text
);
--> statement-breakpoint
CREATE TABLE `Districts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`province_id` integer NOT NULL,
	`name_th` text NOT NULL,
	`name_en` text NOT NULL,
	`name_jp` text,
	FOREIGN KEY (`province_id`) REFERENCES `Provinces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Event_Products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `Events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `Products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`desc` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`banner_img` text,
	`trip_id` integer,
	`area_id` integer,
	`shop_id` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `Ships`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`area_id`) REFERENCES `Areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `Shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`target_type` text NOT NULL,
	`target_brand` text,
	`target_product` text,
	`target_event` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Order_Items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`ticket_id` integer,
	`product_id` integer,
	`final_price` real,
	`quantity` integer,
	`missing` integer,
	`udate` text,
	FOREIGN KEY (`order_id`) REFERENCES `Orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_id`) REFERENCES `Tickets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `Products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`trip_id` integer NOT NULL,
	`address_id` integer NOT NULL,
	`deliv_date` text,
	`track_no` text,
	`courier_name` text,
	`item_price_total` real,
	`shipping_fee_jp_th` real,
	`shipping_fee_th_th` real,
	`grand_total` real,
	`payment_status` text,
	`status` text,
	`sender_id` integer,
	`shipped_date` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `Ships`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`address_id`) REFERENCES `Addresses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`ticket_id` integer,
	`amount` real NOT NULL,
	`payment_type` text NOT NULL,
	`method` text,
	`slip_img` text NOT NULL,
	`status` text,
	`verify_ref` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`order_id`) REFERENCES `Orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_id`) REFERENCES `Tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Product_Locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`area_id` integer NOT NULL,
	`shop_id` integer,
	FOREIGN KEY (`product_id`) REFERENCES `Products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`area_id`) REFERENCES `Areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `Shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`name` text NOT NULL,
	`desc` text,
	`brand` text,
	`price_tentative` real,
	`img` text,
	`tag` text,
	`amount` integer,
	`remain` integer,
	`status` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text,
	FOREIGN KEY (`category_id`) REFERENCES `Categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Provinces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country_id` integer NOT NULL,
	`name_th` text NOT NULL,
	`name_en` text NOT NULL,
	`name_jp` text,
	FOREIGN KEY (`country_id`) REFERENCES `Countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_item_id` integer NOT NULL,
	`agent_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`actual_cost` real NOT NULL,
	`shop_name` text,
	`receipt_img` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`order_item_id`) REFERENCES `Order_Items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Ships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`ship_date` text NOT NULL,
	`track_no` text,
	`ship_price` real,
	`courier_name` text,
	`origin_id` integer NOT NULL,
	`destination_id` integer NOT NULL,
	`max_cap` text,
	`current_cap` text,
	`status` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text,
	FOREIGN KEY (`origin_id`) REFERENCES `Countries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_id`) REFERENCES `Countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Shops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_id` integer NOT NULL,
	`name` text NOT NULL,
	`map_location` text,
	FOREIGN KEY (`area_id`) REFERENCES `Areas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Subdistricts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`district_id` integer NOT NULL,
	`name_th` text NOT NULL,
	`name_en` text NOT NULL,
	`name_jp` text,
	`postal_code` text NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `Districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`agent_id` integer,
	`trip_id` integer,
	`item_name` text NOT NULL,
	`brand` text,
	`shop_name` text,
	`area_name` text,
	`spec` text,
	`img` text NOT NULL,
	`external_link` text,
	`replacement` text,
	`expected_price` real,
	`proposed_price` real,
	`status` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text,
	FOREIGN KEY (`client_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `Ships`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`birth_date` text,
	`gender` text,
	`role` text,
	`cdate` text DEFAULT CURRENT_TIMESTAMP,
	`udate` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Users_email_unique` ON `Users` (`email`);