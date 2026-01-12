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

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if lead with this email already exists
    const { data: existingLead, error: findError } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.error("Error finding lead:", findError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar lead", details: findError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lead;

    if (existingLead) {
      // Update existing lead with meeting date
      console.log("Found existing lead, updating with meeting date:", existingLead.id);
      
      const { data: updatedLead, error: updateError } = await supabase
        .from("leads")
        .update({
          compromisso_date: startTime,
          origin: "calendly",
        })
        .eq("id", existingLead.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating lead:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar lead", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      lead = updatedLead;

      // Create history entry for update
      await supabase.from("lead_history").insert({
        lead_id: lead.id,
        action: "Reunião agendada via Calendly",
        description: `Lead ${name || email} agendou reunião para ${startTime}`,
      });

      // Check if lead already has a pipe_confirmacao entry
      const { data: existingPipe } = await supabase
        .from("pipe_confirmacao")
        .select("id")
        .eq("lead_id", lead.id)
        .maybeSingle();

      if (existingPipe) {
        // Update existing pipe_confirmacao
        await supabase
          .from("pipe_confirmacao")
          .update({
            meeting_date: startTime,
            status: "reuniao_marcada",
          })
          .eq("id", existingPipe.id);
      } else {
        // Create new pipe_confirmacao entry
        await supabase
          .from("pipe_confirmacao")
          .insert({
            lead_id: lead.id,
            status: "reuniao_marcada",
            meeting_date: startTime,
            sdr_id: lead.sdr_id,
          });
      }

      // Remove from pipe_whatsapp if exists (since they now have a meeting)
      await supabase
        .from("pipe_whatsapp")
        .delete()
        .eq("lead_id", lead.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Lead atualizado com reunião do Calendly",
          lead_id: lead.id,
          action: "updated"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // Create new lead
      console.log("No existing lead found, creating new lead");
      
      const { data: newLead, error: createError } = await supabase
        .from("leads")
        .insert({
          name: name || email.split("@")[0],
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

      lead = newLead;

      // Create pipe_confirmacao entry
      await supabase
        .from("pipe_confirmacao")
        .insert({
          lead_id: lead.id,
          status: "reuniao_marcada",
          meeting_date: startTime,
        });

      // Create history entry
      await supabase.from("lead_history").insert({
        lead_id: lead.id,
        action: "Lead criado via Calendly",
        description: `Lead ${name || email} criado automaticamente com reunião agendada para ${startTime}`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Novo lead criado via Calendly",
          lead_id: lead.id,
          action: "created"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Calendly webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
