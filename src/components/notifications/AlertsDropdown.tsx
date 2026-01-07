import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isToday, isBefore, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  type: "meeting_today" | "follow_up_due" | "meeting_soon" | "overdue";
  title: string;
  description: string;
  time: Date;
  link?: string;
  priority: "low" | "medium" | "high";
}

export function AlertsDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ["user-alerts"],
    queryFn: async (): Promise<Alert[]> => {
      const now = new Date();
      const alerts: Alert[] = [];

      // Get meetings today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: meetings } = await supabase
        .from("pipe_confirmacao")
        .select(`
          id,
          meeting_date,
          status,
          lead:leads(name, company)
        `)
        .gte("meeting_date", startOfDay.toISOString())
        .lte("meeting_date", endOfDay.toISOString())
        .not("status", "in", '("compareceu","perdido")');

      meetings?.forEach((meeting) => {
        const meetingDate = new Date(meeting.meeting_date);
        const isWithinNextHour = meetingDate > now && meetingDate < addHours(now, 1);
        
        alerts.push({
          id: `meeting-${meeting.id}`,
          type: isWithinNextHour ? "meeting_soon" : "meeting_today",
          title: isWithinNextHour ? "Reunião em breve!" : "Reunião hoje",
          description: `${meeting.lead?.name}${meeting.lead?.company ? ` - ${meeting.lead.company}` : ""}`,
          time: meetingDate,
          link: "/pipe-confirmacao",
          priority: isWithinNextHour ? "high" : "medium",
        });
      });

      // Get overdue follow-ups
      const { data: followUps } = await supabase
        .from("follow_ups")
        .select(`
          id,
          title,
          due_date,
          priority,
          lead:leads(name)
        `)
        .is("completed_at", null)
        .lte("due_date", now.toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      followUps?.forEach((followUp) => {
        alerts.push({
          id: `followup-${followUp.id}`,
          type: "overdue",
          title: "Follow-up atrasado",
          description: `${followUp.title} - ${followUp.lead?.name}`,
          time: new Date(followUp.due_date),
          link: "/follow-ups",
          priority: followUp.priority === "high" ? "high" : "medium",
        });
      });

      // Get follow-ups due today
      const { data: todayFollowUps } = await supabase
        .from("follow_ups")
        .select(`
          id,
          title,
          due_date,
          lead:leads(name)
        `)
        .is("completed_at", null)
        .gte("due_date", startOfDay.toISOString())
        .lte("due_date", endOfDay.toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      todayFollowUps?.forEach((followUp) => {
        if (!isBefore(new Date(followUp.due_date), now)) {
          alerts.push({
            id: `followup-today-${followUp.id}`,
            type: "follow_up_due",
            title: "Follow-up para hoje",
            description: `${followUp.title} - ${followUp.lead?.name}`,
            time: new Date(followUp.due_date),
            link: "/follow-ups",
            priority: "medium",
          });
        }
      });

      // Sort by priority and time
      return alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.time.getTime() - b.time.getTime();
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const highPriorityCount = alerts.filter((a) => a.priority === "high").length;
  const hasAlerts = alerts.length > 0;

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "meeting_soon":
        return <Zap className="w-4 h-4 text-chart-5" />;
      case "meeting_today":
        return <Calendar className="w-4 h-4 text-primary" />;
      case "follow_up_due":
        return <Clock className="w-4 h-4 text-warning" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
  };

  const getAlertBg = (type: Alert["type"]) => {
    switch (type) {
      case "meeting_soon":
        return "bg-chart-5/10";
      case "meeting_today":
        return "bg-primary/10";
      case "follow_up_due":
        return "bg-warning/10";
      case "overdue":
        return "bg-destructive/10";
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.link) {
      navigate(alert.link);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {hasAlerts && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                highPriorityCount > 0
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {alerts.length > 9 ? "9+" : alerts.length}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Notificações</h3>
          {hasAlerts && (
            <Badge variant="outline" className="text-xs">
              {alerts.length} pendentes
            </Badge>
          )}
        </div>
        
        {hasAlerts ? (
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleAlertClick(alert)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                      getAlertBg(alert.type)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(alert.time, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-success/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Tudo em dia! Nenhuma notificação pendente.
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
