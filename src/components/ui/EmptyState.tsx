import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
        <MaterialIcon icon={icon} size={40} className="text-outline" />
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-1">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
