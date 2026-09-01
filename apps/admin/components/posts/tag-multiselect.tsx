"use client";

import { useMemo, useState } from "react";

import { useCreateBlogTag, type BlogTag } from "@noalhub/api/blog";
import { blogErrorMessage } from "@noalhub/core/blog/error-message";
import { slugify } from "@noalhub/core/blog/slugify";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";

const MAX_SUGGESTIONS = 8;

/**
 * Thẻ = **multi-select có tìm kiếm, cho tạo mới tại chỗ** (§7.1a).
 *
 * Ngược hẳn với ô chuyên mục, và đó không phải chuyện thẩm mỹ: tập chuyên mục là
 * cố định do admin quản lý, còn thẻ thì mọc theo bài. Backend tự `slugify` từ
 * tên và **trùng slug thì trả về thẻ đang có** chứ không 409 — người viết chỉ
 * muốn gắn thẻ, không quan tâm nó mới hay cũ (§2.2).
 *
 * Component giữ **slug**, không giữ id: `BlogPostDto` chỉ trả `{ slug, name }`
 * nên form phải nói cùng ngôn ngữ đó; `toBlogPostPayload` đổi sang id lúc gửi.
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
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createTag = useCreateBlogTag();

  const bySlug = useMemo(
    () => new Map(tags.map((tag) => [tag.slug, tag])),
    [tags],
  );

  const query = search.trim().toLowerCase();
  const suggestions = tags
    .filter((tag) => !value.includes(tag.slug))
    .filter((tag) => (query ? tag.name.toLowerCase().includes(query) : true))
    .slice(0, MAX_SUGGESTIONS);

  // Chỉ mời tạo mới khi không có thẻ nào TRÙNG TÊN — nếu không thì gõ đúng tên
  // một thẻ đã có vẫn thấy nút "Tạo", và người dùng sẽ bấm.
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
      setError(blogErrorMessage(cause));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        label="Thẻ"
        value={search}
        placeholder="Gõ để tìm, Enter để tạo thẻ mới"
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // Ô này nằm trong <form> của editor — Enter mặc định sẽ submit và lưu
          // bài giữa chừng.
          event.preventDefault();
          if (suggestions.length > 0 && !canCreate) add(suggestions[0].slug);
          else if (canCreate) void create();
        }}
      />

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== slug))}
                className="flex items-center gap-1.5 rounded-full bg-black/8 px-2.5 py-1 text-xs transition-opacity hover:opacity-70 dark:bg-white/12"
              >
                <span>#{bySlug.get(slug)?.name ?? slug}</span>
                <span aria-hidden>×</span>
                <span className="sr-only">Bỏ thẻ</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {search.trim() ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag.slug}
              type="button"
              onClick={() => add(tag.slug)}
              className="rounded-full border border-black/15 px-2.5 py-1 text-xs transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              #{tag.name}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              onClick={() => void create()}
              disabled={createTag.isPending}
              className="rounded-full border border-dashed border-black/25 px-2.5 py-1 text-xs disabled:opacity-50 dark:border-white/30"
            >
              {createTag.isPending
                ? "Đang tạo…"
                : `Tạo thẻ “${search.trim()}” (/${slugify(search)})`}
            </button>
          ) : null}
        </div>
      ) : null}

      <FormError message={error} />
    </div>
  );
}
