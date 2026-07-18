ALTER TABLE `Settings` ADD `unpaid_move_days` integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE `Settings` ADD `overdue_cancel_days` integer DEFAULT 14;--> statement-breakpoint
-- Rename the ambiguous fulfillment states. "shipped" ranked after arrival, so
-- it always meant the domestic courier leg; "arrived_th" hard-coded Thailand.
UPDATE `Orders` SET `status` = 'local_shipping' WHERE `status` = 'shipped';--> statement-breakpoint
UPDATE `Orders` SET `status` = 'arrived' WHERE `status` = 'arrived_th';