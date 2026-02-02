-- Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela principal de clientes upsell (sem enums, usando text com check)
CREATE TABLE public.upsell_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  cnpj TEXT,
  setor TEXT,
  tipo_cliente TEXT DEFAULT 'outro',
  responsavel_interno UUID REFERENCES public.team_members(id),
  tipo_cliente_tempo TEXT DEFAULT 'onboarding',
  mrr_atual NUMERIC DEFAULT 0,
  ticket_medio_historico NUMERIC DEFAULT 0,
  ltv_atual NUMERIC DEFAULT 0,
  ltv_projetado NUMERIC DEFAULT 0,
  tempo_contrato_meses INTEGER DEFAULT 0,
  potencial_expansao TEXT DEFAULT 'medio',
  data_primeira_venda TIMESTAMP WITH TIME ZONE,
  pipe_proposta_id UUID REFERENCES public.pipe_propostas(id),
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mapa de produtos por cliente
CREATE TABLE public.upsell_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upsell_client_id UUID NOT NULL REFERENCES public.upsell_clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  status TEXT NOT NULL DEFAULT 'elegivel',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de campanhas/pipeline de upsell (mensal)
CREATE TABLE public.upsell_campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upsell_client_id UUID NOT NULL REFERENCES public.upsell_clients(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  tipo_acao TEXT DEFAULT 'upsell_ativacao',
  campanha_nome TEXT,
  canal TEXT DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'planejado',
  data_abordagem TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  valor_fechado NUMERIC DEFAULT 0,
  receita_incremental NUMERIC DEFAULT 0,
  impacto_ltv NUMERIC DEFAULT 0,
  responsavel_fechamento UUID REFERENCES public.team_members(id),
  pipe_proposta_id UUID REFERENCES public.pipe_propostas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_upsell_clients_responsavel ON public.upsell_clients(responsavel_interno);
CREATE INDEX idx_upsell_clients_potencial ON public.upsell_clients(potencial_expansao);
CREATE INDEX idx_upsell_clients_tempo ON public.upsell_clients(tipo_cliente_tempo);
CREATE INDEX idx_upsell_campanhas_status ON public.upsell_campanhas(status);
CREATE INDEX idx_upsell_campanhas_mes_ano ON public.upsell_campanhas(mes, ano);
CREATE INDEX idx_upsell_produtos_client ON public.upsell_produtos(upsell_client_id);

-- Enable RLS
ALTER TABLE public.upsell_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_campanhas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for upsell_clients
CREATE POLICY "Upsell clients visíveis para team members"
ON public.upsell_clients FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members podem gerenciar upsell clients"
ON public.upsell_clients FOR ALL
USING (is_team_member(auth.uid()));

-- RLS Policies for upsell_produtos
CREATE POLICY "Upsell produtos visíveis para team members"
ON public.upsell_produtos FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members podem gerenciar upsell produtos"
ON public.upsell_produtos FOR ALL
USING (is_team_member(auth.uid()));

-- RLS Policies for upsell_campanhas
CREATE POLICY "Upsell campanhas visíveis para team members"
ON public.upsell_campanhas FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members podem gerenciar upsell campanhas"
ON public.upsell_campanhas FOR ALL
USING (is_team_member(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_upsell_clients_updated_at
BEFORE UPDATE ON public.upsell_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_upsell_campanhas_updated_at
BEFORE UPDATE ON public.upsell_campanhas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.upsell_clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upsell_campanhas;