-- Add is_contract_signed field to pipe_propostas table for contract/deposit confirmation
ALTER TABLE public.pipe_propostas 
ADD COLUMN IF NOT EXISTS is_contract_signed boolean DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.pipe_propostas.is_contract_signed IS 'Indicates if the contract was signed or deposit was made for sold proposals';