"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";

/**
 * 500 của riêng vùng blog: backend chết, timeout, `schema.parse` fail
 * (`docs/blog-plan.md` §6.4).
 *
 * **Bắt buộc `"use client"`** — Next chỉ nhận error boundary ở client.
 *
 * ⚠️ Nó **không** bắt được lỗi trong `generateMetadata`: lỗi ở đó làm hỏng cả
 * route trước khi boundary này tồn tại. Vì vậy mọi `generateMetadata` có fetch
 * phải tự `try/catch` và trả metadata tối thiểu thay vì ném — xem
 * `[slug]/page.tsx`.
 *
 * `unstable_retry` (Next 16.2) render lại segment kèm **fetch lại dữ liệu**;
 * `reset` cũ chỉ xoá trạng thái lỗi rồi render lại bằng đúng dữ liệu đã hỏng,
 * nên nút "Thử lại" dùng nó là bấm bao nhiêu lần cũng ra cùng một lỗi.
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
