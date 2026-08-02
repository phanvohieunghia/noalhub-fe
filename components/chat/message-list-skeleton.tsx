import { Skeleton } from "@/components/ui/skeleton";

/** Bubble giả, xen trái/phải để khung giống nội dung thật. */
export function MessageListSkeleton() {
  const widths = ["w-40", "w-56", "w-32", "w-48", "w-24"];

  return (
    <div role="status" aria-busy className="flex flex-1 flex-col justify-end gap-3 p-4">
      <span className="sr-only">Đang tải tin nhắn…</span>
      {widths.map((width, index) => (
        <div
          key={index}
          className={index % 2 === 0 ? "flex gap-2" : "flex justify-end"}
        >
          {index % 2 === 0 ? <Skeleton className="size-8 shrink-0 rounded-full" /> : null}
          <Skeleton className={`h-9 rounded-2xl ${width}`} />
        </div>
      ))}
    </div>
  );
}
