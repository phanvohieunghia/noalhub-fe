import { Typography } from "./typography";

/** Banner for form-level errors (5xx, offline, anything not tied to a field). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <Typography
      variant="body-3"
      role="alert"
      className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300"
    >
      {message}
    </Typography>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <Typography
      variant="body-3"
      role="status"
      className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-green-700 dark:text-green-300"
    >
      {message}
    </Typography>
  );
}
