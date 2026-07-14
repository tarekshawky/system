-- Prevent stock from ever going negative (e.g. over-issuing an OUT movement)
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_quantity_check" CHECK ("quantity" >= 0);
