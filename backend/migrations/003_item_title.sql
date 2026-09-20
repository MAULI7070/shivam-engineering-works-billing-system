-- Add item_title column to invoice_items for displaying work type (Grinding/Milling/Surface)
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS item_title VARCHAR(100) DEFAULT '';
