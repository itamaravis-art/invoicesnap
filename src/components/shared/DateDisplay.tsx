import { formatRelativeDate, formatDate } from "@/lib/utils";

interface DateDisplayProps {
  date: string;
  relative?: boolean;
  className?: string;
}

export function DateDisplay({ date, relative = false, className = "" }: DateDisplayProps) {
  return (
    <span className={className}>
      {relative ? formatRelativeDate(date) : formatDate(date)}
    </span>
  );
}
