import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "info", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center",
        {
          "bg-secondary-container text-on-secondary-container": variant === "success",
          "bg-tertiary-container text-on-tertiary-container": variant === "warning",
          "bg-error-container text-on-error-container": variant === "error",
          "bg-surface-container-high text-on-surface-variant": variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
