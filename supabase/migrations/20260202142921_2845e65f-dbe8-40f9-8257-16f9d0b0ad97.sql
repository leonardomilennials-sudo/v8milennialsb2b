-- Add new columns to upsell_campanhas for product and value planning
ALTER TABLE upsell_campanhas
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS mrr_planejado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS projeto_planejado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_produto NUMERIC DEFAULT 0;