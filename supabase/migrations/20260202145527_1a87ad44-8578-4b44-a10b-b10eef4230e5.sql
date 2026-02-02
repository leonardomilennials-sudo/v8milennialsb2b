-- Add status field to track active/inactive clients
ALTER TABLE public.upsell_clients 
ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo'));