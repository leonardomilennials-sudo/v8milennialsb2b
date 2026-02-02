import { useState } from "react";
import { TrendingUp, Users, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientesList } from "@/components/upsell/ClientesList";
import { CampanhasSection } from "@/components/upsell/CampanhasSection";

export default function Upsell() {
  const [activeTab, setActiveTab] = useState<"clientes" | "campanhas">("clientes");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Upsell
        </h1>
        <p className="text-muted-foreground">
          Gestão estratégica de expansão de receita da base ativa
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" />
            Base de Clientes
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-2">
            <Target className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-6">
          <ClientesList />
        </TabsContent>

        <TabsContent value="campanhas" className="mt-6">
          <CampanhasSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
