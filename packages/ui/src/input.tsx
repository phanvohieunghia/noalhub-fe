import { forwardRef, useId } from "react";
import { Typography } from "./typography";

type InputProps = React.ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Typography variant="title-4" as="label" htmlFor={inputId}>
        {label}
      </Typography>
      <input
        {...props}
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 rounded-md border px-3 text-body-3 outline-none transition-colors
          bg-surface text-surface-foreground border-border
          placeholder:text-muted-foreground
          hover:border-muted-foreground
          focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40
          disabled:cursor-not-allowed disabled:opacity-50
          aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30
          ${className}`}
      />
      {error ? (
        <Typography
          variant="body-3"
          id={errorId}
          role="alert"
          className="text-danger"
        >
          {error}
        </Typography>
      ) : null}
    </div>
  );
});
