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
        className={`rounded-md border px-3 py-2 text-body-3 outline-none transition-colors
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
