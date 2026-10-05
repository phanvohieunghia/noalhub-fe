"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { usePlayQaSet, useStartQaAttempt } from "@noalhub/api/qa";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

/**
 * The set before starting: what it is, how many questions, one button.
 *
 * A set that is not published answers 404 exactly like one that does not exist
 * — the backend does not distinguish, so neither does this screen. That is what
 * keeps a draft's id from being probeable.
 */
export function LearnSet({ setId }: { setId: string }) {
  const t = useTranslations("web.learn");
  const router = useRouter();
  const set = usePlayQaSet(setId);
  const start = useStartQaAttempt();
  const [starting, setStarting] = useState(false);

  const begin = async () => {
    setStarting(true);
    try {
      const attempt = await start.mutateAsync(setId);
      router.push(`/learn/attempts/${attempt.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (set.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Typography variant="h5" as="h1">
          {t("set.notFound")}
        </Typography>
        <Typography variant="body-3" className="mt-2 opacity-70">
          {t("set.notFoundBody")}
        </Typography>
      </main>
    );
  }

  if (set.isPending || !set.data) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Typography variant="h4" as="h1">
        {set.data.title}
      </Typography>
      {set.data.description ? (
        <Typography variant="body-3" className="mt-1 opacity-70">
          {set.data.description}
        </Typography>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="neutral">
          {t("browse.itemCount", { count: set.data.itemCount })}
        </Badge>
        <Badge tone="info">{t(`shapes.${set.data.templateKey}`)}</Badge>
      </div>

      {set.data.intro ? (
        <div className="mt-4">
          <PostContent doc={set.data.intro} />
        </div>
      ) : null}

      <div className="mt-6">
        <Button onClick={() => void begin()} disabled={starting}>
          {t("set.start")}
        </Button>
        <Typography variant="body-4" className="mt-2 text-muted-foreground">
          {/* Starting twice is safe and the copy should say so — the backend
              hands back the attempt already open. */}
          {t("set.resumeHint")}
        </Typography>
      </div>
    </main>
  );
}
