import { Calendar, Star, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScheduleFollowUpButton } from "@/components/followups/ScheduleFollowUpButton";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  meetingDate?: string;
  rating: number;
  origin: "calendly" | "whatsapp" | "outro";
  sdr?: string;
  sdrId?: string;
  closer?: string;
  closerId?: string;
  tags: string[];
  revenue?: string;
  segment?: string;
  leadId?: string; // Original lead ID from DB
  sourcePipe?: "whatsapp" | "confirmacao" | "propostas";
  sourcePipeId?: string;
}

interface KanbanCardProps {
  lead: Lead;
  onClick?: () => void;
}

const originColors = {
  calendly: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  whatsapp: "bg-success/10 text-success border-success/20",
  outro: "bg-muted text-muted-foreground border-border",
};

const originLabels = {
  calendly: "Calendly",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
  return (
    <div
      onClick={onClick}
      className="kanban-card group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {lead.name}
          </h4>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3" />
            <span className="text-xs truncate">{lead.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {lead.leadId && (
            <ScheduleFollowUpButton
              leadId={lead.leadId}
              leadName={lead.name}
              sourcePipe={lead.sourcePipe}
              sourcePipeId={lead.sourcePipeId}
              defaultAssignedTo={lead.sdrId || lead.closerId}
            />
          )}
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < lead.rating
                    ? "text-primary fill-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {lead.meetingDate && (
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{lead.meetingDate}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="outline" className={originColors[lead.origin]}>
          {originLabels[lead.origin]}
        </Badge>
        {lead.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {lead.tags.length > 2 && (
          <Badge variant="secondary" className="text-xs">
            +{lead.tags.length - 2}
          </Badge>
        )}
      </div>

      {(lead.sdr || lead.closer) && (
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          {lead.sdr && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">SDR: {lead.sdr}</span>
            </div>
          )}
          {lead.closer && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Closer: {lead.closer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
