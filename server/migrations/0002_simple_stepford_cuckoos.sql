ALTER TABLE `Products` RENAME COLUMN "price_tentative" TO "price_tentative_jpy";--> statement-breakpoint
ALTER TABLE `Products` ADD `price_tentative_thb` real;