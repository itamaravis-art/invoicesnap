import { formatCurrency } from "@/lib/utils";

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AmountDisplay({ amount, currency = "ILS", className = "", size = "md" }: AmountDisplayProps) {
  const sizeClasses = {
    sm: "text-sm font-bold",
    md: "text-lg font-black",
    lg: "text-3xl font-black tracking-tighter",
    xl: "text-5xl font-black tracking-tighter",
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
