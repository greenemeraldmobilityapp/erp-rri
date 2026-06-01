ALTER TABLE delivery_order_item ADD COLUMN urutan integer;

UPDATE delivery_order_item
SET urutan = sub.urutan
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY delivery_order_id
    ORDER BY created_at, id
  ) AS urutan
  FROM delivery_order_item
) sub
WHERE delivery_order_item.id = sub.id;
