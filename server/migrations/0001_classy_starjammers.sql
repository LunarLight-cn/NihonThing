ALTER TABLE `Purchases` RENAME COLUMN "actual_cost" TO "actual_cost_jpy";--> statement-breakpoint
ALTER TABLE `Tickets` RENAME COLUMN "proposed_price" TO "proposed_price_jpy";--> statement-breakpoint
ALTER TABLE `Purchases` ADD `actual_cost_thb` real NOT NULL;--> statement-breakpoint
ALTER TABLE `Tickets` ADD `proposed_price_thb` real;