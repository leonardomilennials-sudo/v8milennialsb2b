import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  updated: number; // Leads that were updated with new data
  invalid: number;
  distribution?: Record<string, number>;
}

interface ParsedLead {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  faturamento?: string;
  segment?: string;
  notes?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
}

export function useImportLeads() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Helper to get first non-empty value from multiple columns
  const getFirstValue = (row: Record<string, string>, ...columns: string[]): string | undefined => {
    for (const col of columns) {
      const value = row[col]?.trim();
      if (value) return value;
    }
    return undefined;
  };

  // Helper to get all non-empty values from columns matching a pattern
  const getValuesMatchingPattern = (row: Record<string, string>, patterns: RegExp[]): string[] => {
    const values: string[] = [];
    for (const key of Object.keys(row)) {
      for (const pattern of patterns) {
        if (pattern.test(key)) {
          const value = row[key]?.trim();
          if (value && !values.includes(value)) {
            values.push(value);
          }
          break;
        }
      }
    }
    return values;
  };

  // Helper to consolidate values - returns first non-empty from array of values
  const consolidateField = (row: Record<string, string>, exactColumns: string[], patterns: RegExp[]): string | undefined => {
    // First try exact column matches in priority order
    for (const col of exactColumns) {
      const value = row[col]?.trim();
      if (value) return value;
    }
    
    // Then try pattern matching
    for (const key of Object.keys(row)) {
      for (const pattern of patterns) {
        if (pattern.test(key)) {
          const value = row[key]?.trim();
          if (value) return value;
        }
      }
    }
    
    return undefined;
  };

  const parseCSV = (file: File): Promise<ParsedLead[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          const leads: ParsedLead[] = [];
          
          // Log column names for debugging
          if (results.data.length > 0) {
            console.log("CSV Columns found:", Object.keys(results.data[0] as Record<string, string>));
          }
          
          for (const row of results.data as Record<string, string>[]) {
            // NOME - consolidate multiple name columns
            const name = consolidateField(row, 
              ["Nome completo", "Lead título", "Nome", "Nome do contato", "Contato"],
              [/nome/i, /name/i, /contato/i, /título/i]
            );
            
            // Skip if no name
            if (!name) continue;
            
            // TELEFONE - consolidate all phone columns
            const phone = consolidateField(row,
              ["Celular", "Telefone comercial", "Telefone", "Telefone pessoal", "WhatsApp", "Fone"],
              [/celular/i, /telefone/i, /phone/i, /whatsapp/i, /fone/i, /tel/i]
            );
            
            // EMAIL - consolidate all email columns
            const email = consolidateField(row,
              ["Email comercial", "Email pessoal", "Email", "E-mail", "E-mail comercial", "E-mail pessoal"],
              [/email/i, /e-mail/i, /mail/i]
            );
            
            // Skip if no contact info
            if (!phone && !email) continue;
            
            // EMPRESA - consolidate company columns
            const company = consolidateField(row,
              ["Nome da empresa", "Empresa", "Company", "Razão Social", "Nome fantasia"],
              [/empresa/i, /company/i, /razão/i, /fantasia/i]
            );
            
            // FATURAMENTO - consolidate all revenue/billing columns
            const faturamento = consolidateField(row,
              [
                "Qual o faturamento atual?", 
                "Faturamento", 
                "Faturamento atual",
                "Faturamento mensal",
                "Receita",
                "Receita mensal",
                "Qual é o faturamento mensal atual da sua empresa?",
                "Faixa de faturamento",
                "Revenue"
              ],
              [/faturamento/i, /receita/i, /revenue/i, /billing/i]
            );
            
            // NOTES - concatenate all note columns
            const noteColumns = Object.keys(row).filter(key => 
              /nota/i.test(key) || /note/i.test(key) || /observa/i.test(key) || /comentário/i.test(key)
            );
            const notes = noteColumns
              .map(col => row[col]?.trim())
              .filter(Boolean)
              .join("\n\n");
            
            // SEGMENTO
            const segment = consolidateField(row,
              ["Segmento", "Setor", "Ramo", "Área de atuação", "Nicho"],
              [/segmento/i, /setor/i, /ramo/i, /nicho/i, /área/i]
            );
            
            leads.push({
              name,
              company: company || undefined,
              phone: phone || undefined,
              email: email || undefined,
              faturamento: faturamento || undefined,
              segment: segment || undefined,
              notes: notes || undefined,
              utm_campaign: getFirstValue(row, "utm_campaign", "UTM Campaign") || undefined,
              utm_source: getFirstValue(row, "utm_source", "UTM Source") || undefined,
              utm_medium: getFirstValue(row, "utm_medium", "UTM Medium") || undefined,
              utm_content: getFirstValue(row, "utm_content", "UTM Content") || undefined,
              utm_term: getFirstValue(row, "utm_term", "UTM Term") || undefined,
            });
          }
          
          resolve(leads);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  const formatPhone = (phone: string): string => {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, "");
    
    // If starts with country code, keep it
    if (digits.startsWith("55") && digits.length >= 12) {
      return digits;
    }
    
    // Add Brazil country code if not present
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    
    return digits;
  };

  const importLeads = async (
    file: File,
    campanhaId: string,
    stageId: string,
    sdrId?: string,
    autoDistribute?: boolean,
    memberIds?: string[]
  ): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // 1. Parse CSV
      const parsedLeads = await parseCSV(file);
      console.log(`Parsed ${parsedLeads.length} leads from CSV`);

      if (parsedLeads.length === 0) {
        throw new Error("Nenhum lead válido encontrado no arquivo");
      }

      // 2. Get existing leads by phone for duplicate check and potential update
      const phones = parsedLeads
        .filter(l => l.phone)
        .map(l => formatPhone(l.phone!));
      
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("id, phone, name, company, email, faturamento, segment, notes")
        .in("phone", phones);

      // Create a map for quick lookup and update
      const existingLeadsMap = new Map<string, typeof existingLeads extends (infer T)[] ? T : never>();
      existingLeads?.forEach(l => {
        if (l.phone) existingLeadsMap.set(l.phone, l);
      });

      // 3. Create or get import tag
      const tagName = "Importação Kommo - Janeiro 2026";
      let tagId: string;

      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .maybeSingle();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: tagError } = await supabase
          .from("tags")
          .insert({ name: tagName, color: "#f59e0b" })
          .select("id")
          .single();
        
        if (tagError) throw tagError;
        tagId = newTag.id;
      }

      // 4. Import leads in batches
      const BATCH_SIZE = 25;
      let imported = 0;
      let duplicates = 0;
      let updated = 0;
      let invalid = 0;
      const distribution: Record<string, number> = {};
      let memberIndex = 0;
      const processedPhones = new Set<string>(); // Track phones processed in this import

      // Initialize distribution counter for all members
      if (autoDistribute && memberIds && memberIds.length > 0) {
        memberIds.forEach(id => {
          distribution[id] = 0;
        });
      }

      for (let i = 0; i < parsedLeads.length; i += BATCH_SIZE) {
        const batch = parsedLeads.slice(i, i + BATCH_SIZE);
        
        for (const lead of batch) {
          const formattedPhone = lead.phone ? formatPhone(lead.phone) : undefined;
          
          // Skip if already processed in this import
          if (formattedPhone && processedPhones.has(formattedPhone)) {
            duplicates++;
            continue;
          }

          // Check for existing lead
          const existingLead = formattedPhone ? existingLeadsMap.get(formattedPhone) : null;

          try {
            if (existingLead) {
              // Update existing lead with missing data only
              const updates: Record<string, string | undefined> = {};
              
              if (!existingLead.company && lead.company) updates.company = lead.company;
              if (!existingLead.email && lead.email) updates.email = lead.email;
              if (!existingLead.faturamento && lead.faturamento) updates.faturamento = lead.faturamento;
              if (!existingLead.segment && lead.segment) updates.segment = lead.segment;
              
              // Append notes if new notes exist
              if (lead.notes) {
                const existingNotes = existingLead.notes || "";
                const separator = existingNotes ? "\n\n--- Importação Kommo ---\n\n" : "";
                updates.notes = existingNotes + separator + lead.notes;
              }

              if (Object.keys(updates).length > 0) {
                await supabase
                  .from("leads")
                  .update(updates)
                  .eq("id", existingLead.id);
                updated++;
              } else {
                duplicates++;
              }

              // Check if lead is already in this campaign
              const { data: existingCampanhaLead } = await supabase
                .from("campanha_leads")
                .select("id")
                .eq("campanha_id", campanhaId)
                .eq("lead_id", existingLead.id)
                .maybeSingle();

              if (!existingCampanhaLead) {
                // Determine SDR for this lead
                let assignedSdrId: string | null = null;
                if (autoDistribute && memberIds && memberIds.length > 0) {
                  assignedSdrId = memberIds[memberIndex % memberIds.length];
                  memberIndex++;
                  distribution[assignedSdrId] = (distribution[assignedSdrId] || 0) + 1;
                } else if (sdrId) {
                  assignedSdrId = sdrId;
                }

                // Add to campaign
                await supabase.from("campanha_leads").insert({
                  campanha_id: campanhaId,
                  lead_id: existingLead.id,
                  stage_id: stageId,
                  sdr_id: assignedSdrId,
                });

                // Add tag if not exists
                const { data: existingTagLink } = await supabase
                  .from("lead_tags")
                  .select("id")
                  .eq("lead_id", existingLead.id)
                  .eq("tag_id", tagId)
                  .maybeSingle();

                if (!existingTagLink) {
                  await supabase.from("lead_tags").insert({
                    lead_id: existingLead.id,
                    tag_id: tagId,
                  });
                }
              }

              if (formattedPhone) processedPhones.add(formattedPhone);
              continue;
            }

            // Insert new lead
            const { data: newLead, error: leadError } = await supabase
              .from("leads")
              .insert({
                name: lead.name,
                company: lead.company,
                phone: formattedPhone,
                email: lead.email,
                faturamento: lead.faturamento,
                segment: lead.segment,
                notes: lead.notes,
                origin: "outro" as const,
                utm_campaign: lead.utm_campaign,
                utm_source: lead.utm_source,
                utm_medium: lead.utm_medium,
                utm_content: lead.utm_content,
                utm_term: lead.utm_term,
              })
              .select("id")
              .single();

            if (leadError) {
              console.error("Error inserting lead:", leadError);
              invalid++;
              continue;
            }

            // Determine SDR for this lead
            let assignedSdrId: string | null = null;
            if (autoDistribute && memberIds && memberIds.length > 0) {
              assignedSdrId = memberIds[memberIndex % memberIds.length];
              memberIndex++;
              distribution[assignedSdrId] = (distribution[assignedSdrId] || 0) + 1;
            } else if (sdrId) {
              assignedSdrId = sdrId;
            }

            // Add to campaign
            await supabase.from("campanha_leads").insert({
              campanha_id: campanhaId,
              lead_id: newLead.id,
              stage_id: stageId,
              sdr_id: assignedSdrId,
            });

            // Add tag
            await supabase.from("lead_tags").insert({
              lead_id: newLead.id,
              tag_id: tagId,
            });

            // Add phone to processed set
            if (formattedPhone) {
              processedPhones.add(formattedPhone);
            }

            imported++;
          } catch (error) {
            console.error("Error processing lead:", error);
            invalid++;
          }
        }

        // Update progress
        const progressPercent = Math.round(((i + batch.length) / parsedLeads.length) * 100);
        setProgress(progressPercent);
      }

      const result: ImportResult = {
        total: parsedLeads.length,
        imported,
        duplicates,
        updated,
        invalid,
        distribution: autoDistribute ? distribution : undefined,
      };

      setResult(result);
      setProgress(100);
      
      return result;
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setProgress(0);
    setResult(null);
  };

  return {
    parseCSV,
    importLeads,
    resetImport,
    isImporting,
    progress,
    result,
  };
}
