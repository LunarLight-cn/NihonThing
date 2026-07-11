ALTER TABLE `Events` RENAME COLUMN "title" TO "title_en";--> statement-breakpoint
ALTER TABLE `Events` RENAME COLUMN "desc" TO "desc_en";--> statement-breakpoint
ALTER TABLE `Products` RENAME COLUMN "name" TO "name_en";--> statement-breakpoint
ALTER TABLE `Products` RENAME COLUMN "desc" TO "desc_en";--> statement-breakpoint
ALTER TABLE `Shops` RENAME COLUMN "name" TO "name_en";--> statement-breakpoint
ALTER TABLE `Events` ADD `title_th` text;--> statement-breakpoint
ALTER TABLE `Events` ADD `title_jp` text;--> statement-breakpoint
ALTER TABLE `Events` ADD `desc_th` text;--> statement-breakpoint
ALTER TABLE `Events` ADD `desc_jp` text;--> statement-breakpoint
ALTER TABLE `Products` ADD `name_th` text;--> statement-breakpoint
ALTER TABLE `Products` ADD `name_jp` text;--> statement-breakpoint
ALTER TABLE `Products` ADD `desc_th` text;--> statement-breakpoint
ALTER TABLE `Products` ADD `desc_jp` text;--> statement-breakpoint
ALTER TABLE `Products` ADD `origin_country` text;--> statement-breakpoint
ALTER TABLE `Shops` ADD `name_th` text NOT NULL;--> statement-breakpoint
ALTER TABLE `Shops` ADD `name_jp` text;