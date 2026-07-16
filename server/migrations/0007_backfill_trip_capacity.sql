-- Backfill trip capacity counters from existing orders.
--
-- current_items and current_price were introduced in 0006, so any order placed
-- before that never incremented them and every trip reported 0 / 0. Recompute
-- both from the orders already on each trip. Cancelled orders do not occupy
-- capacity. current_cap (weight) is left alone: it has been tracked all along.

UPDATE Ships SET
  current_items = COALESCE((
    SELECT SUM(oi.quantity)
    FROM Order_Items oi
    JOIN Orders o ON o.id = oi.order_id
    WHERE o.trip_id = Ships.id
      AND (o.status IS NULL OR o.status != 'cancelled')
  ), 0),
  current_price = COALESCE((
    SELECT SUM(o.item_price_total)
    FROM Orders o
    WHERE o.trip_id = Ships.id
      AND (o.status IS NULL OR o.status != 'cancelled')
  ), 0);
