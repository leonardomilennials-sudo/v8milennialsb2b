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
    
    console.log("Calendly webhook received:", JSON.stringify(body));

    // Calendly sends the event type in the root
    const eventType = body.event;
    
    // Only process invitee.created events (new meeting scheduled)
    if (eventType !== "invitee.created") {
      console.log("Ignoring event type:", eventType);
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = body.payload;
    
    if (!payload) {
      return new Response(
        JSON.stringify({ error: "Payload não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract data from Calendly payload
    const email = payload.email;
    const name = payload.name;
    const scheduledEvent = payload.scheduled_event;
    const startTime = scheduledEvent?.start_time;
    
    // Extract phone from questions_and_answers if available
    let phone = null;
    const questionsAndAnswers = payload.questions_and_answers || [];
    for (const qa of questionsAndAnswers) {
      const question = qa.question?.toLowerCase() || "";
      if (question.includes("telefone") || question.includes("phone") || question.includes("celular") || question.includes("whatsapp")) {
        phone = qa.answer;
        break;
      }
    }

    console.log("Extracted data:", { email, name, startTime, phone });

    // Always create a new lead when someone books via Calendly
    console.log("Creating new lead from Calendly booking");
    
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        name: name || (email ? email.split("@")[0] : "Lead Calendly"),
        email,
        phone,
        origin: "calendly",
        compromisso_date: startTime,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating lead:", createError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar lead", details: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pipe_confirmacao entry
    await supabase
      .from("pipe_confirmacao")
      .insert({
        lead_id: newLead.id,
        status: "reuniao_marcada",
        meeting_date: startTime,
      });

    // Create history entry
    await supabase.from("lead_history").insert({
      lead_id: newLead.id,
      action: "Lead criado via Calendly",
      description: `Lead ${name || email || "Calendly"} criado automaticamente com reunião agendada para ${startTime}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Novo lead criado via Calendly",
        lead_id: newLead.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Calendly webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
