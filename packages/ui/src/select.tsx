import { forwardRef, useId } from "react";
import { Typography } from "./typography";

type SelectOption = { value: string; label: string };

type SelectProps = Omit<React.ComponentPropsWithoutRef<"select">, "children"> & {
  label: string;
  options: SelectOption[];
  error?: string;
  /** Nhãn cho lựa chọn rỗng (`value=""`). Bỏ trống = không có mục rỗng. */
  placeholder?: string;
};

/**
 * `<select>` gốc của trình duyệt, chỉ thêm nhãn + trạng thái lỗi — cùng khuôn
 * với `Input` để form trộn hai thứ không bị lệch.
 *
 * Cố tình không dựng dropdown tự vẽ: filter của admin cần chạy được bằng bàn
 * phím và trên mobile, mà đó là chỗ combobox tự chế hay hỏng nhất.
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
      <select
        {...props}
        id={selectId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 rounded-md border px-3 text-body-3 outline-none transition-colors
          border-black/15 dark:border-white/20
          bg-transparent
          focus:border-foreground/60
          disabled:opacity-50
          aria-[invalid=true]:border-red-500
          ${className}`}
      >
        {placeholder ? (
          <option value="" className="bg-background">
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-background">
            {option.label}
          </option>
        ))}
      </select>
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
