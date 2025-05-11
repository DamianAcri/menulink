import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className="block w-full rounded-md border border-[var(--border)] bg-white text-[var(--foreground)] placeholder-gray-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-colors"
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
