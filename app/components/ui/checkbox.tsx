import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", onCheckedChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-colors"
      onChange={e => onCheckedChange ? onCheckedChange(e.target.checked) : undefined}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";
