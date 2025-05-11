import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "outline" | "default";
}

export const Badge: React.FC<BadgeProps> = ({ variant = "default", ...props }) => {
  let className = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold";
  if (variant === "default") {
    className += " bg-[var(--accent)] text-white";
  } else if (variant === "outline") {
    className += " border border-[var(--accent)] text-[var(--accent)] bg-white";
  }
  return <span className={className} {...props} />;
};
