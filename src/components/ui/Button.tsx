import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "error";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold rounded-full transition-all active:scale-95",
          {
            "bg-primary text-on-primary hover:bg-primary/90": variant === "primary",
            "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80": variant === "secondary",
            "border-2 border-outline text-on-surface hover:bg-surface-container": variant === "outline",
            "text-on-surface hover:bg-surface-container": variant === "ghost",
            "bg-error text-on-error hover:bg-error/90": variant === "error",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-5 py-2.5": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
