import { forwardRef, useId } from "react";
import { Typography } from "./typography";

type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  /** Bỏ trống thì phải tự truyền `aria-label` — không có nhãn là lỗi a11y. */
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <Typography variant="title-4" as="label" htmlFor={textareaId}>
          {label}
        </Typography>
      ) : null}
      <textarea
        {...props}
        id={textareaId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`resize-none rounded-md border px-3 py-2 text-body-3 outline-none transition-colors
            border-black/15 dark:border-white/20
            bg-transparent
            focus:border-foreground/60
            disabled:opacity-50
            aria-[invalid=true]:border-red-500
            ${className}`}
      />
      {error ? (
        <Typography
          variant="body-3"
          id={errorId}
          role="alert"
          className="text-red-600 dark:text-red-400"
        >
          {error}
        </Typography>
      ) : null}
    </div>
  );
});
