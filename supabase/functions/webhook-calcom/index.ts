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
    
    console.log("Cal.com webhook received:", JSON.stringify(body));

    // Cal.com sends the event type as triggerEvent or trigger
    const eventType = body.triggerEvent || body.trigger;
    
    // Only process BOOKING_CREATED events (new meeting scheduled)
    if (eventType !== "BOOKING_CREATED") {
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

    // Extract data from Cal.com payload
    // Cal.com uses attendees array for guest info
    const attendees = payload.attendees || [];
    const firstAttendee = attendees[0] || {};
    const responses = payload.responses || {};
    
    // Get email and name from attendees or responses
    const email = firstAttendee.email || responses.email;
    const name = firstAttendee.name || responses.name || payload.title;
    const startTime = payload.startTime;
    
    // Extract phone from responses if available
    const phone = responses.phone || responses.telefone || responses.celular || responses.whatsapp || null;

    console.log("Extracted data:", { email, name, startTime, phone });

    // Always create a new lead when someone books via Cal.com
    console.log("Creating new lead from Cal.com booking");
    
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        name: name || (email ? email.split("@")[0] : "Lead Cal.com"),
        email,
        phone,
        origin: "calendly", // keeping same origin type for compatibility
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
      action: "Lead criado via Cal.com",
      description: `Lead ${name || email || "Cal.com"} criado automaticamente com reunião agendada para ${startTime}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Novo lead criado via Cal.com",
        lead_id: newLead.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Cal.com webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
