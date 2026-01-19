import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  invalid: number;
}

interface ParsedLead {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  faturamento?: string;
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

  const parseCSV = (file: File): Promise<ParsedLead[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          const leads: ParsedLead[] = [];
          
          for (const row of results.data as Record<string, string>[]) {
            // Get name - try "Nome completo" first, then "Lead título"
            const name = (row["Nome completo"] || row["Lead título"] || "").trim();
            
            // Skip if no name
            if (!name) continue;
            
            // Get phone - try different variations
            const phone = (row["Celular"] || row["Telefone comercial"] || "").trim();
            
            // Get email
            const email = (row["Email comercial"] || row["Email pessoal"] || "").trim();
            
            // Skip if no contact info
            if (!phone && !email) continue;
            
            // Concatenate notes
            const nota1 = (row["Nota"] || "").trim();
            const nota2 = (row["Nota 2"] || "").trim();
            const notes = [nota1, nota2].filter(Boolean).join("\n\n");
            
            leads.push({
              name,
              company: (row["Nome da empresa"] || "").trim() || undefined,
              phone: phone || undefined,
              email: email || undefined,
              faturamento: (row["Qual o faturamento atual?"] || "").trim() || undefined,
              notes: notes || undefined,
              utm_campaign: (row["utm_campaign"] || "").trim() || undefined,
              utm_source: (row["utm_source"] || "").trim() || undefined,
              utm_medium: (row["utm_medium"] || "").trim() || undefined,
              utm_content: (row["utm_content"] || "").trim() || undefined,
              utm_term: (row["utm_term"] || "").trim() || undefined,
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
    sdrId?: string
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

      // 2. Get existing phones for duplicate check
      const phones = parsedLeads
        .filter(l => l.phone)
        .map(l => formatPhone(l.phone!));
      
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("id, phone")
        .in("phone", phones);

      const existingPhones = new Set(existingLeads?.map(l => l.phone) || []);

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
      let invalid = 0;

      for (let i = 0; i < parsedLeads.length; i += BATCH_SIZE) {
        const batch = parsedLeads.slice(i, i + BATCH_SIZE);
        
        for (const lead of batch) {
          const formattedPhone = lead.phone ? formatPhone(lead.phone) : undefined;
          
          // Check for duplicate
          if (formattedPhone && existingPhones.has(formattedPhone)) {
            duplicates++;
            continue;
          }

          try {
            // Insert lead
            const { data: newLead, error: leadError } = await supabase
              .from("leads")
              .insert({
                name: lead.name,
                company: lead.company,
                phone: formattedPhone,
                email: lead.email,
                faturamento: lead.faturamento,
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

            // Add to campaign
            await supabase.from("campanha_leads").insert({
              campanha_id: campanhaId,
              lead_id: newLead.id,
              stage_id: stageId,
              sdr_id: sdrId || null,
            });

            // Add tag
            await supabase.from("lead_tags").insert({
              lead_id: newLead.id,
              tag_id: tagId,
            });

            // Add phone to existing set to prevent duplicates within same import
            if (formattedPhone) {
              existingPhones.add(formattedPhone);
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
        invalid,
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
