"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";

/**
 * The blog area's own 500: a dead backend, a timeout, a failed `schema.parse`
 * (`docs/blog.md` §6.4).
 *
 * **`"use client"` is required** — Next only accepts error boundaries on the
 * client.
 *
 * ⚠️ It does **not** catch errors in `generateMetadata`: a failure there breaks
 * the whole route before this boundary exists. So every `generateMetadata` that
 * fetches must `try/catch` itself and return minimal metadata rather than throw
 * — see `[slug]/page.tsx`.
 *
 * `unstable_retry` (Next 16.2) re-renders the segment and **refetches the
 * data**; the older `reset` only clears the error state and re-renders with the
 * very data that failed, so a "Retry" button built on it produces the same error
 * however many times it is pressed.
 */
export default function BlogError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("web.blog.error");

  useEffect(() => {
    console.error("[blog]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <Typography variant="h3" as="h1">
        {t("title")}
      </Typography>
      <Typography variant="body-3" className="opacity-70">
        {t("message")}
      </Typography>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => unstable_retry()}>{t("retry")}</Button>
        <Link href="/blogs" className="text-body-3 underline underline-offset-4">
          {t("backToList")}
        </Link>
      </div>
    </div>
  );
}
