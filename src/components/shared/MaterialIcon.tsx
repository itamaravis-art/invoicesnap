"use client";

interface MaterialIconProps {
  icon: string;
  filled?: boolean;
  className?: string;
  size?: number;
}

export function MaterialIcon({ icon, filled = false, className = "", size }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {icon}
    </span>
  );
}
