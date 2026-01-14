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

    if (!email) {
      console.log("No email found in webhook payload");
      return new Response(
        JSON.stringify({ error: "Email não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper function to get or create a tag
    async function getOrCreateTag(tagName: string, tagColor: string): Promise<string> {
      // Check if tag exists
      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .single();

      if (existingTag) {
        return existingTag.id;
      }

      // Create the tag
      const { data: newTag, error } = await supabase
        .from("tags")
        .insert({ name: tagName, color: tagColor })
        .select("id")
        .single();

      if (error) {
        console.error(`Error creating tag ${tagName}:`, error);
        throw error;
      }

      return newTag.id;
    }

    // Helper function to add tag to lead
    async function addTagToLead(leadId: string, tagId: string): Promise<void> {
      // Check if lead already has this tag
      const { data: existingLeadTag } = await supabase
        .from("lead_tags")
        .select("id")
        .eq("lead_id", leadId)
        .eq("tag_id", tagId)
        .single();

      if (existingLeadTag) {
        console.log("Lead already has this tag");
        return;
      }

      const { error } = await supabase
        .from("lead_tags")
        .insert({ lead_id: leadId, tag_id: tagId });

      if (error) {
        console.error("Error adding tag to lead:", error);
        throw error;
      }
    }

    // Search for existing lead with this email
    const { data: existingLead, error: searchError } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (searchError && searchError.code !== "PGRST116") {
      console.error("Error searching for lead:", searchError);
    }

    // Get or create necessary tags
    const quizTagId = await getOrCreateTag("Quiz", "#22C55E");
    const calTagId = await getOrCreateTag("Cal", "#3B82F6");
    const reuniaoMarcadaTagId = await getOrCreateTag("Reunião Marcada", "#F59E0B");

    if (existingLead) {
      // SCENARIO 1: Lead with this email already exists (Quiz + Cal = Ambos)
      console.log("Found existing lead:", existingLead.id);

      // Update the existing lead with meeting info and set origin to "ambos"
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          origin: "ambos", // Lead veio do Quiz e agora agendou via Cal
          compromisso_date: startTime,
          notes: existingLead.notes 
            ? `${existingLead.notes}\n\n[Cal.com] Reunião agendada: ${startTime}`
            : `[Cal.com] Reunião agendada: ${startTime}`,
        })
        .eq("id", existingLead.id);

      if (updateError) {
        console.error("Error updating lead:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar lead", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Ensure Quiz tag is present
      await addTagToLead(existingLead.id, quizTagId);

      // Add "Reunião Marcada" tag
      await addTagToLead(existingLead.id, reuniaoMarcadaTagId);

      // Create or update pipe_confirmacao entry
      const { data: existingConfirmacao } = await supabase
        .from("pipe_confirmacao")
        .select("id")
        .eq("lead_id", existingLead.id)
        .single();

      if (existingConfirmacao) {
        await supabase
          .from("pipe_confirmacao")
          .update({
            status: "reuniao_marcada",
            meeting_date: startTime,
          })
          .eq("id", existingConfirmacao.id);
      } else {
        await supabase
          .from("pipe_confirmacao")
          .insert({
            lead_id: existingLead.id,
            status: "reuniao_marcada",
            meeting_date: startTime,
          });
      }

      // Create history entry
      await supabase.from("lead_history").insert({
        lead_id: existingLead.id,
        action: "Reunião agendada via Cal.com",
        description: `Lead unificado - reunião agendada para ${startTime}`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Lead existente atualizado com dados do Cal.com",
          lead_id: existingLead.id,
          scenario: "unified",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // SCENARIO 2: No lead with this email exists - create new lead with Cal origin
      console.log("No existing lead found, creating new lead from Cal.com");
      
      const { data: newLead, error: createError } = await supabase
        .from("leads")
        .insert({
          name: name || `Agendamento Cal - ${email.split("@")[0]}`,
          email,
          phone,
          origin: "cal", // Lead veio direto do Cal.com, sem passar pelo Quiz
          compromisso_date: startTime,
          notes: `[Cal.com] Lead criado a partir de agendamento direto`,
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

      // Add "Cal" tag to new lead
      await addTagToLead(newLead.id, calTagId);

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
        description: `Novo lead criado a partir de agendamento Cal.com - reunião para ${startTime}`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Novo lead criado via Cal.com",
          lead_id: newLead.id,
          scenario: "new_cal_lead",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Cal.com webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
