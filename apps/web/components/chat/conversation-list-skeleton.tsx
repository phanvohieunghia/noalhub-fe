import { useTranslations } from "next-intl";

import { Skeleton } from "@noalhub/ui/skeleton";

export function ConversationListSkeleton() {
  const t = useTranslations("web.chat.sidebar");

  return (
    <div role="status" aria-busy className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-2">
      <span className="sr-only">{t("loading")}</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg p-2">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
