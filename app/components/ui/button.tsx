import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "default";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    let base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    let variantClass =
      variant === "outline"
        ? "bg-white text-[var(--accent)] border border-[var(--accent)] hover:bg-gray-50 focus:ring-[var(--accent)]"
        : "bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-hover-bg)] focus:ring-[var(--accent)]";
    return (
      <button ref={ref} className={`${base} ${variantClass} ${className}`} {...props} />
    );
  }
);
Button.displayName = "Button";
