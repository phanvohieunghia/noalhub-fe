"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { useQaAttemptReview } from "@noalhub/api/qa";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

/**
 * Looking back at an attempt already taken.
 *
 * This is the only place besides the moment of answering where an answer key is
 * visible, and it is safe for two reasons the backend enforces: the attempt
 * belongs to the caller, and **every question here has already been answered**.
 * A question left untouched has no entry — that is a boundary, not an omission.
 */
export function LearnReview({ attemptId }: { attemptId: string }) {
  const t = useTranslations("web.learn");
  const review = useQaAttemptReview(attemptId);

  if (review.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  const rows = review.data ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Typography variant="h4" as="h1">
          {t("review.title")}
        </Typography>
        <Button variant="outline" asChild>
          <Link href="/learn">{t("attempt.backToBrowse")}</Link>
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {t("review.empty")}
          </Typography>
        ) : (
          rows.map((row) => (
            <article key={row.itemId} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={row.isCorrect ? "success" : "danger"}>
                  {row.isCorrect ? t("review.correct") : t("review.wrong")}
                </Badge>
                <Badge tone="neutral">{t(`kinds.${row.kind}`)}</Badge>
                {/* Self-assessed answers are labelled, because they mean
                    something different from a machine-checked one. */}
                {row.grading === "self" ? (
                  <Badge tone="info">{t("review.selfGraded")}</Badge>
                ) : null}
              </div>

              <div className="mt-2">
                <PostContent doc={row.question} />
              </div>

              {row.options ? (
                <ul className="mt-3 space-y-1">
                  {row.options.map((option) => {
                    const chosen =
                      "optionIds" in row.response &&
                      row.response.optionIds.includes(option.id);
                    return (
                      <li
                        key={option.id}
                        className={`rounded-md px-2 py-1 text-body-3 ${
                          chosen ? "bg-muted font-medium" : "opacity-70"
                        }`}
                      >
                        {option.text}
                        {chosen ? ` · ${t("review.yourPick")}` : ""}
                      </li>
                    );
                  })}
                </ul>
              ) : "text" in row.response ? (
                <Typography variant="body-3" className="mt-3">
                  {t("review.youWrote", { text: row.response.text })}
                </Typography>
              ) : null}

              {row.answer ? (
                <div className="mt-3 border-t border-border pt-3">
                  <Typography variant="title-4">{t("attempt.answer")}</Typography>
                  <PostContent doc={row.answer} />
                </div>
              ) : null}

              {row.explanation ? (
                <div className="mt-3 border-t border-border pt-3">
                  <Typography variant="title-4">{t("attempt.explanation")}</Typography>
                  <PostContent doc={row.explanation} />
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
