import { forwardRef, useId } from "react";

type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  /** Bỏ trống thì phải tự truyền `aria-label` — không có nhãn là lỗi a11y. */
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, id, className = "", ...props }, ref) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={textareaId} className="text-sm font-medium">
            {label}
          </label>
        ) : null}
        <textarea
          {...props}
          id={textareaId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`resize-none rounded-md border px-3 py-2 text-sm outline-none transition-colors
            border-black/15 dark:border-white/20
            bg-transparent
            focus:border-foreground/60
            disabled:opacity-50
            aria-[invalid=true]:border-red-500
            ${className}`}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
