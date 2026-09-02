import { Typography } from "@noalhub/ui/typography";

/**
 * A `type: "system"` message — membership changes, group renames, and so on.
 *
 * Rendered quite differently from a normal bubble: a small centered line, no
 * avatar, no timestamp, taking nobody's side. The enum is already in the spec
 * even though no phase-1 event produces one yet.
 */
export function MessageSystemNotice({ body }: { body: string }) {
  return (
    <Typography variant="body-4" className="py-1 text-center opacity-60">
      {body}
    </Typography>
  );
}
