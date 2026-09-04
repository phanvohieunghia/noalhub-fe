import { forwardRef, useId } from "react";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";

type SelectOption = { value: string; label: string };

type SelectProps = Omit<React.ComponentPropsWithoutRef<"select">, "children"> & {
  label: string;
  options: SelectOption[];
  error?: string;
  /** Label for the empty choice (`value=""`). Omitted means no empty option. */
  placeholder?: string;
};

/**
 * The browser's native `<select>` with the platform arrow replaced by our own
 * chevron, shaped like `Input` so a form mixing the two stays aligned.
 *
 * Deliberately not a custom-drawn dropdown: admin's filters have to work by
 * keyboard and on mobile, which is exactly where hand-rolled comboboxes break.
 * Only the closed control is styled — the open list stays native.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, placeholder, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Typography variant="title-4" as="label" htmlFor={selectId}>
        {label}
      </Typography>
      <div className="relative">
        <select
          {...props}
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`peer h-10 w-full appearance-none rounded-md border pl-3 pr-9 text-body-3
            bg-surface text-surface-foreground border-border
            outline-none transition-colors
            hover:border-muted-foreground
            focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40
            disabled:cursor-not-allowed disabled:opacity-50
            aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30
            ${className}`}
        >
          {placeholder ? (
            <option value="" className="bg-surface text-muted-foreground">
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface">
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          icon={ICONS.chevronDown}
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2
            text-muted-foreground transition-colors peer-focus-visible:text-primary
            peer-disabled:opacity-50"
        />
      </div>
      {error ? (
        <Typography variant="body-3" id={errorId} role="alert" className="text-danger">
          {error}
        </Typography>
      ) : null}
    </div>
  );
});
