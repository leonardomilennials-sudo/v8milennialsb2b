import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to normalize email (lowercase, trim)
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

// Helper function to normalize name for comparison
function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// Helper function to get start and end of day for a given date
function getDayBoundaries(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    
    // Valid origin enum values
    const validOrigins = ["calendly", "whatsapp", "meta_ads", "remarketing", "base_clientes", "parceiro", "indicacao", "quiz", "site", "organico", "outro"];
    
    // Expected fields from n8n
    const {
      name,
      email,
      phone,
      company,
      origin: rawOrigin,
      segment,
      faturamento,
      urgency,
      notes,
      rating,
      sdr_id,
      meeting_date,
      compromisso_date,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = body;

    // If compromisso_date is filled, set origin to "calendly", otherwise normalize origin
    const origin = compromisso_date ? "calendly" : (validOrigins.includes(rawOrigin) ? rawOrigin : "outro");
    
    // Normalize email for comparison (case-insensitive)
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeName(name);
    
    console.log("Received lead data:", { name, email, normalizedEmail, phone, origin, rawOrigin, compromisso_date, rating });

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Nome é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // DEDUPLICATION LOGIC
    // ============================================
    let existingLead = null;
    let deduplicationMethod = null;

    // 1. First, try to find by email (case-insensitive)
    if (normalizedEmail) {
      console.log("Searching for existing lead by email (case-insensitive):", normalizedEmail);
      
      const { data: leads, error: searchError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!searchError && leads) {
        // Find lead with matching email (case-insensitive)
        existingLead = leads.find(lead => normalizeEmail(lead.email) === normalizedEmail);
        if (existingLead) {
          deduplicationMethod = "email";
          console.log("Found existing lead by email:", existingLead.id);
        }
      }
    }

    // 2. If no email match, try to find by name + same day
    if (!existingLead && normalizedName) {
      const today = new Date();
      const { start, end } = getDayBoundaries(today);
      
      console.log("Searching for existing lead by name + same day:", normalizedName, "between", start, "and", end);
      
      const { data: todayLeads, error: searchError } = await supabase
        .from("leads")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });

      if (!searchError && todayLeads) {
        // Find lead with matching name (case-insensitive, normalized spaces)
        existingLead = todayLeads.find(lead => normalizeName(lead.name) === normalizedName);
        if (existingLead) {
          deduplicationMethod = "name_same_day";
          console.log("Found existing lead by name + same day:", existingLead.id);
        }
      }
    }

    // ============================================
    // HANDLE EXISTING LEAD (UNIFICATION)
    // ============================================
    if (existingLead) {
      console.log("Unifying with existing lead:", existingLead.id, "via:", deduplicationMethod);

      // Merge data: update only if new value exists and old value is empty/null
      const updatedData: Record<string, any> = {};
      
      if (phone && !existingLead.phone) updatedData.phone = phone;
      if (company && !existingLead.company) updatedData.company = company;
      if (segment && !existingLead.segment) updatedData.segment = segment;
      if (faturamento && !existingLead.faturamento) updatedData.faturamento = faturamento;
      if (urgency && !existingLead.urgency) updatedData.urgency = urgency;
      if (sdr_id && !existingLead.sdr_id) updatedData.sdr_id = sdr_id;
      
      // Always update email if we found by name and new email is provided
      if (deduplicationMethod === "name_same_day" && normalizedEmail && !existingLead.email) {
        updatedData.email = email;
      }

      // Merge UTM params (keep existing, add new if missing)
      if (utm_source && !existingLead.utm_source) updatedData.utm_source = utm_source;
      if (utm_medium && !existingLead.utm_medium) updatedData.utm_medium = utm_medium;
      if (utm_campaign && !existingLead.utm_campaign) updatedData.utm_campaign = utm_campaign;
      if (utm_term && !existingLead.utm_term) updatedData.utm_term = utm_term;
      if (utm_content && !existingLead.utm_content) updatedData.utm_content = utm_content;

      // Update rating if new rating is higher
      if (rating && parseInt(String(rating), 10) > (existingLead.rating || 0)) {
        updatedData.rating = parseInt(String(rating), 10);
      }

      // Append notes
      if (notes) {
        updatedData.notes = existingLead.notes 
          ? `${existingLead.notes}\n\n[Unificado] ${notes}`
          : notes;
      }

      // Handle compromisso_date - ALWAYS preserve existing, or use new if none exists
      const newCompromissoDate = compromisso_date || null;
      const finalCompromissoDate = existingLead.compromisso_date || newCompromissoDate;
      
      if (newCompromissoDate && !existingLead.compromisso_date) {
        // Only update if existing lead has no compromisso_date
        updatedData.compromisso_date = newCompromissoDate;
        updatedData.origin = "ambos"; // Mark as lead from multiple sources
      } else if (existingLead.compromisso_date && newCompromissoDate && existingLead.compromisso_date !== newCompromissoDate) {
        // If both have dates, keep existing and log the conflict
        updatedData.notes = (updatedData.notes || existingLead.notes || '') + 
          `\n\n[Conflito de data] Nova data recebida: ${newCompromissoDate} - mantida data original: ${existingLead.compromisso_date}`;
      }
      // If existingLead.compromisso_date exists and no new date, nothing changes (preserves existing)

      // Apply updates if any
      if (Object.keys(updatedData).length > 0) {
        const { error: updateError } = await supabase
          .from("leads")
          .update(updatedData)
          .eq("id", existingLead.id);

        if (updateError) {
          console.error("Error updating lead:", updateError);
        } else {
          console.log("Lead updated with merged data:", updatedData);
        }
      }

      // Handle pipe routing for unified lead
      // Use existing compromisso_date if available, otherwise use new one
      const effectiveCompromissoDate = existingLead.compromisso_date || newCompromissoDate;
      
      if (effectiveCompromissoDate) {
        // Check if already in pipe_confirmacao
        const { data: existingConfirmacao } = await supabase
          .from("pipe_confirmacao")
          .select("id")
          .eq("lead_id", existingLead.id)
          .single();

        if (existingConfirmacao) {
          // Update existing pipe_confirmacao
          await supabase
            .from("pipe_confirmacao")
            .update({
              status: "reuniao_marcada",
              meeting_date: newCompromissoDate,
            })
            .eq("id", existingConfirmacao.id);
        } else {
          // Create new pipe_confirmacao entry
          await supabase
            .from("pipe_confirmacao")
            .insert({
              lead_id: existingLead.id,
              status: "reuniao_marcada",
              sdr_id: sdr_id || existingLead.sdr_id || null,
              meeting_date: newCompromissoDate,
            });
        }

        // Remove from pipe_whatsapp if exists
        await supabase
          .from("pipe_whatsapp")
          .delete()
          .eq("lead_id", existingLead.id);

        console.log("Lead moved to pipe_confirmacao");
      }

      // Create history entry for unification
      await supabase.from("lead_history").insert({
        lead_id: existingLead.id,
        action: "Lead unificado",
        description: `Lead duplicado detectado (${deduplicationMethod === "email" ? "mesmo email" : "mesmo nome no mesmo dia"}). Dados mesclados automaticamente.`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Lead existente atualizado (duplicado unificado)",
          lead_id: existingLead.id,
          deduplication_method: deduplicationMethod,
          pipe: newCompromissoDate ? "confirmacao" : "whatsapp"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // CREATE NEW LEAD (NO DUPLICATE FOUND)
    // ============================================
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        phone,
        company,
        origin,
        segment,
        faturamento: faturamento || null,
        urgency,
        notes,
        rating: rating ? parseInt(String(rating), 10) : 0,
        sdr_id,
        compromisso_date: compromisso_date || null,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar lead", details: leadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route lead based on whether compromisso_date is filled
    if (lead.compromisso_date) {
      // Lead has compromisso_date - create in pipe_confirmacao with reuniao_marcada
      const { error: pipeConfirmacaoError } = await supabase
        .from("pipe_confirmacao")
        .insert({
          lead_id: lead.id,
          status: "reuniao_marcada",
          sdr_id: sdr_id || null,
          meeting_date: lead.compromisso_date,
        });

      if (pipeConfirmacaoError) {
        console.error("Error creating pipe_confirmacao:", pipeConfirmacaoError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar entrada no pipe confirmação", details: pipeConfirmacaoError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create history entry for confirmacao
      await supabase.from("lead_history").insert({
        lead_id: lead.id,
        action: "Lead criado via integração",
        description: `Lead ${name} adicionado automaticamente no pipe de confirmação com reunião marcada para ${lead.compromisso_date}`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Lead criado com sucesso no pipe de confirmação",
          lead_id: lead.id,
          pipe: "confirmacao"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lead without compromisso_date - create in pipe_whatsapp with status "novo"
    const { error: pipeError } = await supabase
      .from("pipe_whatsapp")
      .insert({
        lead_id: lead.id,
        status: "novo",
        sdr_id,
      });

    if (pipeError) {
      console.error("Error creating pipe_whatsapp:", pipeError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar entrada no pipe", details: pipeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create history entry
    await supabase.from("lead_history").insert({
      lead_id: lead.id,
      action: "Lead criado via integração",
      description: `Lead ${name} adicionado automaticamente via webhook`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead criado com sucesso",
        lead_id: lead.id,
        pipe: "whatsapp"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
