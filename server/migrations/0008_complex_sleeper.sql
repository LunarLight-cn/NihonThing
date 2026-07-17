ALTER TABLE `Order_Items` ADD `claimed_by` integer REFERENCES Users(id);--> statement-breakpoint
ALTER TABLE `Order_Items` ADD `claimed_at` text;--> statement-breakpoint
ALTER TABLE `Purchases` ADD `order_id` integer REFERENCES Orders(id);--> statement-breakpoint
-- Derive order_id for any purchase already tied to a line. The purchase form
-- never sent order_item_id, so this is expected to touch nothing; it exists so
-- the column is right wherever a row did get linked.
UPDATE `Purchases` SET `order_id` = (
  SELECT `order_id` FROM `Order_Items` WHERE `Order_Items`.`id` = `Purchases`.`order_item_id`
) WHERE `order_item_id` IS NOT NULL AND `order_id` IS NULL;