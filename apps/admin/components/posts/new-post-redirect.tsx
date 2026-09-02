"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useCreateBlogPost } from "@noalhub/api/blog";
import { Button } from "@noalhub/ui/button";
import { useTranslations } from "next-intl";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

/**
 * `/posts/new` **creates a draft and immediately `replace`s to `/posts/[id]`**
 * (`docs/blog.md` §7.1).
 *
 * Why not build a separate "create" form: this way every later action has
 * exactly ONE save path (`PATCH`), instead of create/update branches that must
 * be kept in sync forever — including `version`, `slug` and the publish
 * checklist.
 *
 * `replace` rather than `push`: pressing Back from the editor must land on
 * `/posts`, not return here and create yet another empty draft.
 */
export function NewPostRedirect() {
  const t = useTranslations("admin.posts");
  const tc = useTranslations("common");
  const router = useRouter();
  const create = useCreateBlogPost();
  // StrictMode runs effects twice in dev — without this latch, every visit to
  // `/posts/new` produces two drafts.
  const started = useRef(false);

  // ⚠️ `mutateAsync`, NOT `mutate(_, { onSuccess })`.
  //
  // A callback passed to `mutate` belongs to that mount's observer; StrictMode
  // unmounts and remounts immediately, the first observer is discarded and the
  // callback never runs — while the `started` latch stops the second mount from
  // calling again. The result: the draft really is created (POST 201) but the
  // page hangs forever on "Creating draft…". `mutateAsync`'s promise lives
  // independently of the observer.
  const start = () => {
    create
      .mutateAsync(undefined)
      .then((post) => router.replace(`/posts/${post.id}`))
      // The error already lives in `create.isError` and is rendered below; this
      // `catch` only keeps the promise from becoming an unhandled rejection.
      .catch(() => {});
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (create.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={create.error} />
        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => {
              create.reset();
              start();
            }}
          >
            {tc("actions.retry")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full p-6">
      <Typography variant="body-3" className="opacity-70">
        {t("new.creating")}
      </Typography>
    </main>
  );
}
