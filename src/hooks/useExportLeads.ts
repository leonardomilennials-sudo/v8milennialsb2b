import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export function useExportLeads() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    toast.info("Gerando Excel completo...");

    try {
      // Fetch all data in parallel
      const [
        leadsResult,
        pipeWhatsappResult,
        pipeConfirmacaoResult,
        pipePropostasResult,
        tagsResult,
        teamMembersResult,
        productsResult,
      ] = await Promise.all([
        supabase.from("leads").select(`
          *,
          sdr:team_members!leads_sdr_id_fkey(id, name),
          closer:team_members!leads_closer_id_fkey(id, name),
          lead_tags(tag:tags(id, name, color))
        `).order("created_at", { ascending: false }),
        supabase.from("pipe_whatsapp").select(`
          *,
          lead:leads(id, name),
          sdr:team_members!pipe_whatsapp_sdr_id_fkey(id, name)
        `).order("created_at", { ascending: false }),
        supabase.from("pipe_confirmacao").select(`
          *,
          lead:leads(id, name),
          sdr:team_members!pipe_confirmacao_sdr_id_fkey(id, name),
          closer:team_members!pipe_confirmacao_closer_id_fkey(id, name)
        `).order("created_at", { ascending: false }),
        supabase.from("pipe_propostas").select(`
          *,
          lead:leads(id, name),
          product:products(id, name, type),
          closer:team_members!pipe_propostas_closer_id_fkey(id, name)
        `).order("created_at", { ascending: false }),
        supabase.from("tags").select("*").order("name"),
        supabase.from("team_members").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
      ]);

      // Check for errors
      if (leadsResult.error) throw leadsResult.error;
      if (pipeWhatsappResult.error) throw pipeWhatsappResult.error;
      if (pipeConfirmacaoResult.error) throw pipeConfirmacaoResult.error;
      if (pipePropostasResult.error) throw pipePropostasResult.error;
      if (tagsResult.error) throw tagsResult.error;
      if (teamMembersResult.error) throw teamMembersResult.error;
      if (productsResult.error) throw productsResult.error;

      const leads = leadsResult.data || [];
      const pipeWhatsapp = pipeWhatsappResult.data || [];
      const pipeConfirmacao = pipeConfirmacaoResult.data || [];
      const pipePropostas = pipePropostasResult.data || [];
      const tags = tagsResult.data || [];
      const teamMembers = teamMembersResult.data || [];
      const products = productsResult.data || [];

      // Format leads data
      const leadsData = leads.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.phone || "",
        origin: lead.origin,
        rating: lead.rating || 0,
        segment: lead.segment || "",
        faturamento: lead.faturamento || "",
        urgency: lead.urgency || "",
        notes: lead.notes || "",
        sdr_id: lead.sdr_id || "",
        sdr_nome: lead.sdr?.name || "",
        closer_id: lead.closer_id || "",
        closer_nome: lead.closer?.name || "",
        tags: lead.lead_tags?.map((lt: any) => lt.tag?.name).filter(Boolean).join(", ") || "",
        compromisso_date: lead.compromisso_date ? format(new Date(lead.compromisso_date), "yyyy-MM-dd HH:mm") : "",
        utm_campaign: lead.utm_campaign || "",
        utm_source: lead.utm_source || "",
        utm_medium: lead.utm_medium || "",
        utm_content: lead.utm_content || "",
        utm_term: lead.utm_term || "",
        created_at: lead.created_at ? format(new Date(lead.created_at), "yyyy-MM-dd HH:mm") : "",
        updated_at: lead.updated_at ? format(new Date(lead.updated_at), "yyyy-MM-dd HH:mm") : "",
      }));

      // Format pipe_whatsapp data
      const whatsappData = pipeWhatsapp.map((item: any) => ({
        id: item.id,
        lead_id: item.lead_id,
        lead_nome: item.lead?.name || "",
        status: item.status,
        sdr_id: item.sdr_id || "",
        sdr_nome: item.sdr?.name || "",
        scheduled_date: item.scheduled_date ? format(new Date(item.scheduled_date), "yyyy-MM-dd HH:mm") : "",
        notes: item.notes || "",
        created_at: item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd HH:mm") : "",
        updated_at: item.updated_at ? format(new Date(item.updated_at), "yyyy-MM-dd HH:mm") : "",
      }));

      // Format pipe_confirmacao data
      const confirmacaoData = pipeConfirmacao.map((item: any) => ({
        id: item.id,
        lead_id: item.lead_id,
        lead_nome: item.lead?.name || "",
        status: item.status,
        meeting_date: item.meeting_date ? format(new Date(item.meeting_date), "yyyy-MM-dd HH:mm") : "",
        is_confirmed: item.is_confirmed ? "Sim" : "Não",
        sdr_id: item.sdr_id || "",
        sdr_nome: item.sdr?.name || "",
        closer_id: item.closer_id || "",
        closer_nome: item.closer?.name || "",
        notes: item.notes || "",
        created_at: item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd HH:mm") : "",
        updated_at: item.updated_at ? format(new Date(item.updated_at), "yyyy-MM-dd HH:mm") : "",
      }));

      // Format pipe_propostas data
      const propostasData = pipePropostas.map((item: any) => ({
        id: item.id,
        lead_id: item.lead_id,
        lead_nome: item.lead?.name || "",
        status: item.status,
        product_id: item.product_id || "",
        product_nome: item.product?.name || "",
        product_type: item.product?.type || item.product_type || "",
        sale_value: item.sale_value || 0,
        calor: item.calor || 5,
        commitment_date: item.commitment_date ? format(new Date(item.commitment_date), "yyyy-MM-dd HH:mm") : "",
        contract_duration: item.contract_duration || "",
        is_contract_signed: item.is_contract_signed ? "Sim" : "Não",
        closer_id: item.closer_id || "",
        closer_nome: item.closer?.name || "",
        notes: item.notes || "",
        closed_at: item.closed_at ? format(new Date(item.closed_at), "yyyy-MM-dd HH:mm") : "",
        created_at: item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd HH:mm") : "",
        updated_at: item.updated_at ? format(new Date(item.updated_at), "yyyy-MM-dd HH:mm") : "",
      }));

      // Format tags data
      const tagsData = tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color || "",
      }));

      // Format team members data
      const teamData = teamMembers.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email || "",
        role: member.role,
        is_active: member.is_active ? "Sim" : "Não",
        user_id: member.user_id || "",
      }));

      // Format products data
      const productsData = products.map((product: any) => ({
        id: product.id,
        name: product.name,
        type: product.type,
        ticket: product.ticket || 0,
        ticket_minimo: product.ticket_minimo || 0,
        is_active: product.is_active ? "Sim" : "Não",
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add sheets
      const leadsSheet = XLSX.utils.json_to_sheet(leadsData);
      const whatsappSheet = XLSX.utils.json_to_sheet(whatsappData);
      const confirmacaoSheet = XLSX.utils.json_to_sheet(confirmacaoData);
      const propostasSheet = XLSX.utils.json_to_sheet(propostasData);
      const tagsSheet = XLSX.utils.json_to_sheet(tagsData);
      const teamSheet = XLSX.utils.json_to_sheet(teamData);
      const productsSheet = XLSX.utils.json_to_sheet(productsData);

      // Set column widths
      const setColumnWidths = (sheet: XLSX.WorkSheet, widths: number[]) => {
        sheet["!cols"] = widths.map(w => ({ wch: w }));
      };

      setColumnWidths(leadsSheet, [36, 25, 20, 30, 15, 15, 8, 15, 15, 10, 40, 36, 20, 36, 20, 30, 20, 20, 20, 20, 20, 20, 20, 20]);
      setColumnWidths(whatsappSheet, [36, 36, 25, 15, 36, 20, 20, 40, 20, 20]);
      setColumnWidths(confirmacaoSheet, [36, 36, 25, 20, 20, 10, 36, 20, 36, 20, 40, 20, 20]);
      setColumnWidths(propostasSheet, [36, 36, 25, 20, 36, 25, 15, 12, 8, 20, 12, 10, 36, 20, 40, 20, 20, 20]);
      setColumnWidths(tagsSheet, [36, 20, 10]);
      setColumnWidths(teamSheet, [36, 25, 30, 10, 10, 36]);
      setColumnWidths(productsSheet, [36, 25, 15, 12, 12, 10]);

      XLSX.utils.book_append_sheet(wb, leadsSheet, "Leads");
      XLSX.utils.book_append_sheet(wb, whatsappSheet, "Pipe_WhatsApp");
      XLSX.utils.book_append_sheet(wb, confirmacaoSheet, "Pipe_Confirmacao");
      XLSX.utils.book_append_sheet(wb, propostasSheet, "Pipe_Propostas");
      XLSX.utils.book_append_sheet(wb, tagsSheet, "Tags");
      XLSX.utils.book_append_sheet(wb, teamSheet, "Team_Members");
      XLSX.utils.book_append_sheet(wb, productsSheet, "Products");

      // Generate filename with date
      const dateStr = format(new Date(), "yyyy-MM-dd_HH-mm");
      const filename = `leads_export_${dateStr}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);

      toast.success(`Excel exportado com sucesso! ${leads.length} leads exportados.`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToExcel, isExporting };
}
