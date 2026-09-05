import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

const meta: Meta<typeof Icon> = {
  title: "UI/Data Display/Icons",
  component: Icon,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * Các mức zoom: ô càng hẹp thì một hàng chứa càng nhiều icon. `row` luôn cao
 * đúng bằng ô — nhãn chỉ một dòng nên nội dung không đẩy ô cao ra.
 */
const ZOOM_STEPS = [
  { tile: 72, row: 64, icon: "size-4", label: "text-[10px]", box: "gap-1 py-1.5" },
  { tile: 96, row: 80, icon: "size-5", label: "text-[11px]", box: "gap-1.5 py-2" },
  { tile: 128, row: 96, icon: "size-6", label: "text-body-4", box: "gap-2 py-3" },
  { tile: 176, row: 120, icon: "size-8", label: "text-body-3", box: "gap-2 py-4" },
  { tile: 240, row: 152, icon: "size-10", label: "text-body-2", box: "gap-3 py-5" },
] as const;
const DEFAULT_ZOOM = 2;

type Zoom = (typeof ZOOM_STEPS)[number];

/** Mức zoom + hai nút chỉnh, dùng chung cho cả hai bảng. */
function useZoom() {
  const [index, setIndex] = useState(DEFAULT_ZOOM);
  const zoom = ZOOM_STEPS[index]!;
  const tIcons = useTranslations("sb.icons");

  const controls = (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={tIcons("zoomOut")}
        disabled={index === 0}
        onClick={() => setIndex((current) => Math.max(0, current - 1))}
      >
        <Icon icon={LUCIDE.zoomOut} className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={tIcons("zoomIn")}
        disabled={index === ZOOM_STEPS.length - 1}
        onClick={() =>
          setIndex((current) => Math.min(ZOOM_STEPS.length - 1, current + 1))
        }
      >
        <Icon icon={LUCIDE.zoomIn} className="size-4" />
      </Button>
    </div>
  );
  return { zoom, controls };
}

/** Copy-to-clipboard state shared by both grids. */
function useCopyName() {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const copy = useCallback(async (name: string) => {
    try {
      // Undefined outside a secure context (Storybook served over plain HTTP).
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(name);
      setFailed(false);
      setCopied(name);
      setTimeout(
        () => setCopied((current) => (current === name ? null : current)),
        1200,
      );
    } catch {
      setFailed(true);
    }
  }, []);

  return { copied, failed, copy };
}

function IconTile({
  name,
  iconName,
  isCopied,
  zoom,
  onCopy,
}: {
  name: string;
  iconName: string;
  isCopied: boolean;
  zoom: Zoom;
  onCopy: (name: string) => void;
}) {
  const t = useTranslations("sb.icons");

  return (
    // Tên bị cắt bằng "…" nên phải có chỗ xem đủ: Tooltip thay cho `title` —
    // hiện nhanh, đọc được bằng bàn phím và theo đúng màu của theme.
    <Tooltip label={t("copyHint", { name })}>
      <button
        type="button"
        onClick={() => onCopy(name)}
        className={`flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border px-1 text-center transition-colors ${zoom.box} ${
          isCopied
            ? "border-primary bg-primary/10"
            : "border-border hover:bg-muted"
        }`}
      >
        <Icon
          icon={isCopied ? ICONS.success : iconName}
          className={`shrink-0 ${zoom.icon} ${isCopied ? "text-primary" : "text-foreground"}`}
        />
        <span
          className={`w-full truncate ${zoom.label} ${isCopied ? "text-primary" : "opacity-70"}`}
        >
          {isCopied ? t("copied") : name}
        </span>
      </button>
    </Tooltip>
  );
}

function ClipboardWarning({ failed }: { failed: boolean }) {
  const t = useTranslations("sb.icons");

  if (!failed) return null;
  return (
    <Typography variant="body-4" role="alert" className="text-danger">
      {t("clipboardBlocked")}
    </Typography>
  );
}

/**
 * Những icon dự án đang thật sự dùng: các alias trong `ICONS`, đặt tên theo
 * công dụng (`delete`, `sortAsc`) chứ không theo hình vẽ. Đây là bảng nên tra
 * trước; chỉ sang "All Lucide" khi không có alias nào hợp.
 */
export const InUse: Story = {
  render: function InUseStory() {
    const { copied, failed, copy } = useCopyName();
    const { zoom, controls } = useZoom();
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <ClipboardWarning failed={failed} />
          <div className="ml-auto">{controls}</div>
        </div>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${zoom.tile}px, 1fr))`,
          }}
        >
          {Object.entries(ICONS).map(([name, iconName]) => (
            <div key={name} style={{ height: zoom.row }}>
              <IconTile
                name={name}
                iconName={iconName}
                isCopied={copied === name}
                zoom={zoom}
                onCopy={copy}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Toàn bộ bộ lucide đã đóng gói sẵn (kể cả alias). Lưới ảo hoá theo hàng nên chỉ
 * những ô lọt trong khung nhìn mới được dựng — không giới hạn số kết quả.
 */
export const AllLucide: Story = {
  // Fullscreen so the grid can own the viewport height; the padding the meta's
  // "padded" layout would add is applied on the wrapper below instead.
  parameters: { layout: "fullscreen" },
  render: function AllLucideStory() {
    const t = useTranslations("sb.icons");
    const [query, setQuery] = useState("");
    const { copied, failed, copy } = useCopyName();
    const { zoom, controls } = useZoom();

    const all = useMemo(() => Object.entries(LUCIDE) as [string, string][], []);
    const matches = useMemo(() => {
      const needle = query.trim().toLowerCase().replace(/[-\s]/g, "");
      if (!needle) return all;
      return all.filter(
        ([name, icon]) =>
          name.toLowerCase().includes(needle) ||
          icon.replace(/-/g, "").includes(needle),
      );
    }, [all, query]);
    // Column count comes from the real width — the virtualizer needs a row count,
    // so responsive breakpoints in CSS alone would not be enough.
    const scrollRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
      const element = scrollRef.current;
      if (!element) return;
      const observer = new ResizeObserver(([entry]) => {
        setWidth(entry.contentRect.width);
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    const columns = Math.max(1, Math.floor(width / zoom.tile) || 1);

    const rowCount = Math.ceil(matches.length / columns);
    const virtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => scrollRef.current,
      estimateSize: () => zoom.row,
      overscan: 4,
    });
    // Số hàng và chiều cao hàng đổi theo mức zoom — phải đo lại, nếu không lưới
    // vẫn giữ nguyên tổng chiều cao của mức zoom trước.
    useEffect(() => {
      virtualizer.measure();
    }, [virtualizer, zoom, columns]);

    return (
      <div className="flex h-screen flex-col gap-4 p-4">
        <Input
          label={t("search")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex items-center justify-between gap-4">
          <Typography variant="body-4" className="text-muted-foreground">
            {t("count", { matched: matches.length, total: all.length })}{" "}
            <code>LUCIDE.</code>
          </Typography>
          {controls}
        </div>
        <ClipboardWarning failed={failed} />
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border p-2"
        >
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((row) => (
              <div
                key={row.key}
                className="absolute left-0 top-0 grid w-full items-stretch gap-2 p-1"
                style={{
                  height: row.size,
                  transform: `translateY(${row.start}px)`,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {matches
                  .slice(row.index * columns, row.index * columns + columns)
                  .map(([name, iconName]) => (
                    <IconTile
                      key={name}
                      name={name}
                      iconName={iconName}
                      isCopied={copied === name}
                      zoom={zoom}
                      onCopy={copy}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
