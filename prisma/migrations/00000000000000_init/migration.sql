-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'shipped', 'delivered');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Create notification function
CREATE OR REPLACE FUNCTION notify_order_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  record_data JSON;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'recordId', OLD.id,
      'timestamp', NOW()
    );
  ELSE
    record_data = row_to_json(NEW);
    payload = json_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'recordId', NEW.id,
      'timestamp', NOW(),
      'data', record_data
    );
  END IF;

  PERFORM pg_notify('orders_channel', payload::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER orders_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON "orders"
FOR EACH ROW
EXECUTE FUNCTION notify_order_change();
