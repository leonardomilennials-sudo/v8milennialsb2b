import { useEffect, useState } from "react";
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, isPast } from "date-fns";
import { Clock, AlertTriangle, Timer, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingCountdownProps {
  meetingDate: Date;
  variant?: "default" | "compact" | "hero";
  className?: string;
}

export function MeetingCountdown({ meetingDate, variant = "default", className }: MeetingCountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const totalSeconds = differenceInSeconds(meetingDate, now);
  const isOverdue = isPast(meetingDate);
  
  const days = Math.abs(differenceInDays(meetingDate, now));
  const hours = Math.abs(differenceInHours(meetingDate, now)) % 24;
  const minutes = Math.abs(differenceInMinutes(meetingDate, now)) % 60;
  const seconds = Math.abs(totalSeconds) % 60;

  const getUrgencyLevel = () => {
    if (isOverdue) return "overdue";
    if (totalSeconds <= 3600) return "imminent"; // 1 hour
    if (totalSeconds <= 7200) return "urgent"; // 2 hours
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    if (days <= 3) return "soon";
    return "normal";
  };

  const urgency = getUrgencyLevel();

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-mono",
        urgency === "overdue" && "text-destructive",
        urgency === "imminent" && "text-destructive animate-pulse",
        urgency === "urgent" && "text-orange-500",
        urgency === "today" && "text-warning",
        urgency === "tomorrow" && "text-yellow-500",
        className
      )}>
        <Timer className="w-3 h-3" />
        {isOverdue ? "-" : ""}
        {days > 0 && `${days}d `}
        {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={cn(
        "p-4 rounded-xl border-2 bg-gradient-to-br",
        urgency === "overdue" && "from-destructive/20 to-destructive/5 border-destructive/50",
        urgency === "imminent" && "from-destructive/30 to-destructive/10 border-destructive animate-pulse",
        urgency === "urgent" && "from-orange-500/20 to-orange-500/5 border-orange-500/50",
        urgency === "today" && "from-warning/20 to-warning/5 border-warning/50",
        urgency === "tomorrow" && "from-yellow-500/20 to-yellow-500/5 border-yellow-500/50",
        urgency === "soon" && "from-blue-500/20 to-blue-500/5 border-blue-500/50",
        urgency === "normal" && "from-muted/50 to-muted/20 border-border",
        className
      )}>
        <div className="flex items-center gap-2 mb-2">
          {urgency === "overdue" || urgency === "imminent" ? (
            <AlertTriangle className={cn("w-5 h-5", urgency === "imminent" && "animate-bounce", urgency === "overdue" ? "text-destructive" : "text-destructive")} />
          ) : (
            <Clock className={cn(
              "w-5 h-5",
              urgency === "urgent" && "text-orange-500",
              urgency === "today" && "text-warning",
              urgency === "tomorrow" && "text-yellow-500",
              urgency === "soon" && "text-blue-500",
              urgency === "normal" && "text-muted-foreground"
            )} />
          )}
          <span className={cn(
            "text-sm font-medium",
            urgency === "overdue" && "text-destructive",
            urgency === "imminent" && "text-destructive",
            urgency === "urgent" && "text-orange-500",
            urgency === "today" && "text-warning",
          )}>
            {isOverdue ? "Reunião atrasada!" : 
             urgency === "imminent" ? "Reunião iminente!" :
             urgency === "today" ? "Hoje" :
             urgency === "tomorrow" ? "Amanhã" : "Tempo restante"}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {days > 0 && (
            <div className="text-center">
              <div className={cn(
                "text-3xl font-bold font-mono tabular-nums",
                urgency === "overdue" && "text-destructive",
                urgency === "imminent" && "text-destructive",
                urgency === "urgent" && "text-orange-500",
                urgency === "today" && "text-warning"
              )}>
                {isOverdue ? "-" : ""}{days}
              </div>
              <div className="text-xs text-muted-foreground uppercase">dias</div>
            </div>
          )}
          {days > 0 && <span className="text-2xl text-muted-foreground">:</span>}
          <div className="text-center">
            <div className={cn(
              "text-3xl font-bold font-mono tabular-nums",
              urgency === "overdue" && "text-destructive",
              urgency === "imminent" && "text-destructive",
              urgency === "urgent" && "text-orange-500",
              urgency === "today" && "text-warning"
            )}>
              {hours.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-muted-foreground uppercase">horas</div>
          </div>
          <span className="text-2xl text-muted-foreground">:</span>
          <div className="text-center">
            <div className={cn(
              "text-3xl font-bold font-mono tabular-nums",
              urgency === "overdue" && "text-destructive",
              urgency === "imminent" && "text-destructive",
              urgency === "urgent" && "text-orange-500",
              urgency === "today" && "text-warning"
            )}>
              {minutes.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-muted-foreground uppercase">min</div>
          </div>
          <span className="text-2xl text-muted-foreground">:</span>
          <div className="text-center">
            <div className={cn(
              "text-3xl font-bold font-mono tabular-nums",
              urgency === "overdue" && "text-destructive",
              urgency === "imminent" && "text-destructive",
              urgency === "urgent" && "text-orange-500",
              urgency === "today" && "text-warning"
            )}>
              {seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-xs text-muted-foreground uppercase">seg</div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-mono",
      urgency === "overdue" && "bg-destructive/20 text-destructive",
      urgency === "imminent" && "bg-destructive/20 text-destructive animate-pulse",
      urgency === "urgent" && "bg-orange-500/20 text-orange-500",
      urgency === "today" && "bg-warning/20 text-warning",
      urgency === "tomorrow" && "bg-yellow-500/20 text-yellow-500",
      urgency === "soon" && "bg-blue-500/20 text-blue-500",
      urgency === "normal" && "bg-muted text-muted-foreground",
      className
    )}>
      <Timer className="w-3.5 h-3.5" />
      <span className="tabular-nums">
        {isOverdue ? "-" : ""}
        {days > 0 && `${days}d `}
        {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
