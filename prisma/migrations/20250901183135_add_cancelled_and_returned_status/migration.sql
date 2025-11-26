-- AlterTable
ALTER TABLE `shipments` MODIFY `order_status` ENUM('yet_to_be_picked', 'picked_up', 'intransit', 'on_the_way', 'terminal_shipping', 'delivered', 'delivery_rejected', 'onhold', 'returned', 'cancelled', 'out_for_delivery') NOT NULL DEFAULT 'yet_to_be_picked';

-- AlterTable
ALTER TABLE `status_updates` MODIFY `order_status` ENUM('yet_to_be_picked', 'picked_up', 'intransit', 'on_the_way', 'terminal_shipping', 'delivered', 'delivery_rejected', 'onhold', 'returned', 'cancelled', 'out_for_delivery') NOT NULL;
