import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = body;

    // Normalize origin - if invalid, default to "outro"
    const origin = validOrigins.includes(rawOrigin) ? rawOrigin : "outro";
    
    console.log("Received lead data:", { name, email, phone, origin, rawOrigin, rating });

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Nome é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create the lead
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
        meeting_date: meeting_date || null,
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

    // 2. Route lead based on whether compromisso_date is filled
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

    // 3. Create history entry
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
