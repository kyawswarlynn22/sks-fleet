import { cn } from "@/lib/utils";

type StatusVariant = "available" | "busy" | "charging" | "idle" | "highway" | "pickup" | "rest";

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  available: "bg-success/20 text-success border-success/30",
  busy: "bg-destructive/20 text-destructive border-destructive/30",
  charging: "bg-warning/20 text-warning border-warning/30",
  idle: "bg-muted text-muted-foreground border-border",
  highway: "bg-primary/20 text-primary border-primary/30",
  pickup: "bg-info/20 text-info border-info/30",
  rest: "bg-warning/20 text-warning border-warning/30",
};

export function StatusBadge({ variant, children, className, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
        variantStyles[variant],
        pulse && "animate-pulse-glow",
        className
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        variant === "available" && "bg-success",
        variant === "busy" && "bg-destructive",
        variant === "charging" && "bg-warning",
        variant === "idle" && "bg-muted-foreground",
        variant === "highway" && "bg-primary",
        variant === "pickup" && "bg-info",
        variant === "rest" && "bg-warning"
      )} />
      {children}
    </span>
  );
}
