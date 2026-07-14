ALTER TABLE `Orders` ADD `order_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `Orders_order_code_unique` ON `Orders` (`order_code`);