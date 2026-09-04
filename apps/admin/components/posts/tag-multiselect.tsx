"use client";

import { useMemo, useState } from "react";

import { useCreateBlogTag, type BlogTag } from "@noalhub/api/blog";
import { blogErrorText } from "@noalhub/core/blog/error-message";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { slugify } from "@noalhub/core/blog/slugify";
import { ToastError } from "@noalhub/ui/toast";
import { Button } from "@noalhub/ui/button";
import { Input } from "@noalhub/ui/input";

const MAX_SUGGESTIONS = 8;

/**
 * Tags are a **searchable multi-select that can create on the spot** (§7.1a).
 *
 * The exact opposite of the category field, and not for cosmetic reasons: the
 * category set is fixed and admin-managed, while tags grow with the posts. The
 * backend `slugify`s the name itself and, **on a slug collision, returns the
 * existing tag** rather than a 409 — the author just wants the tag attached and
 * does not care whether it is new (§2.2).
 *
 * The component holds **slugs**, not ids: `BlogPostDto` only returns
 * `{ slug, name }`, so the form has to speak the same language;
 * `toBlogPostPayload` converts to ids when sending.
 */
export function TagMultiselect({
  tags,
  value,
  onChange,
}: {
  tags: BlogTag[];
  value: string[];
  onChange: (slugs: string[]) => void;
}) {
  const t = useTranslations("admin.posts");
  const m = useMessage();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<Message | string | null>(null);
  const createTag = useCreateBlogTag();

  const bySlug = useMemo(() => new Map(tags.map((tag) => [tag.slug, tag])), [tags]);

  const query = search.trim().toLowerCase();
  const suggestions = tags
    .filter((tag) => !value.includes(tag.slug))
    .filter((tag) => (query ? tag.name.toLowerCase().includes(query) : true))
    .slice(0, MAX_SUGGESTIONS);

  // Only offer creation when no tag has that EXACT NAME — otherwise typing an
  // existing tag's name still shows a "Create" button, and people will click
  // it.
  const exactExists = tags.some((tag) => tag.name.toLowerCase() === query);
  const canCreate = query.length > 0 && !exactExists;

  const add = (slug: string) => {
    if (!value.includes(slug)) onChange([...value, slug]);
    setSearch("");
  };

  const create = async () => {
    setError(null);
    try {
      const tag = await createTag.mutateAsync(search.trim());
      add(tag.slug);
    } catch (cause) {
      setError(blogErrorText(cause));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={t("tags.label")}
        value={search}
        placeholder={t("tags.searchPlaceholder")}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // This field sits inside the editor's <form> — Enter would otherwise
          // submit and save the post mid-edit.
          event.preventDefault();
          if (suggestions.length > 0 && !canCreate) add(suggestions[0].slug);
          else if (canCreate) void create();
        }}
      />

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((slug) => (
            <li key={slug}>
              <Button
                variant="soft"
                size="xs"
                shape="circle"
                onClick={() => onChange(value.filter((item) => item !== slug))}
              >
                <span>#{bySlug.get(slug)?.name ?? slug}</span>
                <span aria-hidden>×</span>
                <span className="sr-only">{t("tags.remove")}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {search.trim() ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <Button
              key={tag.slug}
              variant="outline"
              size="xs"
              shape="circle"
              onClick={() => add(tag.slug)}
            >
              #{tag.name}
            </Button>
          ))}
          {canCreate ? (
            <Button
              variant="dashed"
              size="xs"
              shape="circle"
              onClick={() => void create()}
              disabled={createTag.isPending}
            >
              {createTag.isPending
                ? t("tags.creating")
                : t("tags.create", { name: search.trim(), slug: slugify(search) })}
            </Button>
          ) : null}
        </div>
      ) : null}

      <ToastError message={m(error)} />
    </div>
  );
}
