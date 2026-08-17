"use client";

/**
 * Lọc CLIENT-SIDE danh sách đã tải — backend chưa có endpoint tìm kiếm hội
 * thoại. Nghĩa là nó không tìm được hội thoại nằm ở trang chưa tải; đó là giới
 * hạn đã biết, không phải bug.
 */
export function ConversationSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="shrink-0 px-2 pb-2">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm hội thoại đã tải…"
        aria-label="Tìm hội thoại"
        className="w-full rounded-md border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-foreground/60 dark:border-white/20"
      />
    </div>
  );
}
