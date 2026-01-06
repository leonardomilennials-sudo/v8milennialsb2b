import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import PipeConfirmacao from "./pages/PipeConfirmacao";
import PipePropostas from "./pages/PipePropostas";
import Ranking from "./pages/Ranking";
import Metas from "./pages/Metas";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

// Wrapper for pages that need the main layout
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/pipe-confirmacao"
            element={
              <LayoutWrapper>
                <PipeConfirmacao />
              </LayoutWrapper>
            }
          />
          <Route
            path="/ranking"
            element={
              <LayoutWrapper>
                <Ranking />
              </LayoutWrapper>
            }
          />
          <Route
            path="/metas"
            element={
              <LayoutWrapper>
                <Metas />
              </LayoutWrapper>
            }
          />
          {/* Placeholder routes for other pages */}
          <Route
            path="/pipe-propostas"
            element={
              <LayoutWrapper>
                <PipePropostas />
              </LayoutWrapper>
            }
          />
          <Route
            path="/pipe-whatsapp"
            element={
              <LayoutWrapper>
                <div className="p-8"><h1 className="text-2xl font-bold">Leads WhatsApp SDR</h1><p className="text-muted-foreground mt-2">Em desenvolvimento...</p></div>
              </LayoutWrapper>
            }
          />
          <Route
            path="/leads"
            element={
              <LayoutWrapper>
                <div className="p-8"><h1 className="text-2xl font-bold">Base de Leads</h1><p className="text-muted-foreground mt-2">Em desenvolvimento...</p></div>
              </LayoutWrapper>
            }
          />
          <Route
            path="/premiacoes"
            element={
              <LayoutWrapper>
                <div className="p-8"><h1 className="text-2xl font-bold">Premiações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento...</p></div>
              </LayoutWrapper>
            }
          />
          <Route
            path="/comissoes"
            element={
              <LayoutWrapper>
                <div className="p-8"><h1 className="text-2xl font-bold">Comissões</h1><p className="text-muted-foreground mt-2">Em desenvolvimento...</p></div>
              </LayoutWrapper>
            }
          />
          <Route
            path="/equipe"
            element={
              <LayoutWrapper>
                <div className="p-8"><h1 className="text-2xl font-bold">Equipe</h1><p className="text-muted-foreground mt-2">Em desenvolvimento...</p></div>
              </LayoutWrapper>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <LayoutWrapper>
                <div className="p-8"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento...</p></div>
              </LayoutWrapper>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
