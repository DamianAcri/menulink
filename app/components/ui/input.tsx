import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className="block w-full rounded-md border border-[var(--border)] bg-white text-[var(--foreground)] placeholder-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-colors"
      {...props}
    />
  )
);
Input.displayName = "Input";
