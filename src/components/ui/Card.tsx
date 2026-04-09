import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "elevated";
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-8 transition-transform",
        {
          "bg-surface-container-lowest": variant === "default",
          "bg-primary-container text-on-primary-container": variant === "primary",
          "bg-surface-container-lowest shadow-lg": variant === "elevated",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
