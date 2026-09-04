import type { Meta, StoryObj } from "@storybook/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

const TILE_MIN_WIDTH = 128;
/** Ô luôn cao đúng bằng đây: nhãn chỉ một dòng nên nội dung không đẩy ô cao ra. */
const ROW_HEIGHT = 96;

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
  onCopy,
}: {
  name: string;
  iconName: string;
  isCopied: boolean;
  onCopy: (name: string) => void;
}) {
  return (
    // Tên bị cắt bằng "…" nên phải có chỗ xem đủ: Tooltip thay cho `title` —
    // hiện nhanh, đọc được bằng bàn phím và theo đúng màu của theme.
    <Tooltip label={`Nhấn để sao chép "${name}"`}>
      <button
        type="button"
        onClick={() => onCopy(name)}
        className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border py-4 px-1 text-center transition-colors ${
          isCopied
            ? "border-primary bg-primary/10"
            : "border-border hover:bg-muted"
        }`}
      >
        <Icon
          icon={isCopied ? ICONS.success : iconName}
          className={`size-6 ${isCopied ? "text-primary" : "text-foreground"}`}
        />
        <span
          className={`w-full truncate text-body-4 ${isCopied ? "text-primary" : "opacity-70"}`}
        >
          {isCopied ? "Đã chép!" : name}
        </span>
      </button>
    </Tooltip>
  );
}

function ClipboardWarning({ failed }: { failed: boolean }) {
  if (!failed) return null;
  return (
    <Typography variant="body-4" role="alert" className="text-danger">
      Trình duyệt chặn clipboard (trang không chạy trên HTTPS hoặc localhost) —
      hãy chép tên thủ công.
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
    return (
      <div className="flex flex-col gap-3">
        <ClipboardWarning failed={failed} />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {Object.entries(ICONS).map(([name, iconName]) => (
            <div key={name} className="h-24">
              <IconTile
                name={name}
                iconName={iconName}
                isCopied={copied === name}
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
    const [query, setQuery] = useState("");
    const { copied, failed, copy } = useCopyName();

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
    const [columns, setColumns] = useState(6);
    useEffect(() => {
      const element = scrollRef.current;
      if (!element) return;
      const observer = new ResizeObserver(([entry]) => {
        setColumns(
          Math.max(1, Math.floor(entry.contentRect.width / TILE_MIN_WIDTH)),
        );
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const rowCount = Math.ceil(matches.length / columns);
    const virtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => scrollRef.current,
      estimateSize: () => ROW_HEIGHT,
      overscan: 4,
    });

    return (
      <div className="flex h-screen flex-col gap-4 p-4">
        <Input
          label="Tìm icon"
          placeholder="ví dụ: bell, arrow, user…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Typography variant="body-4" className="text-muted-foreground">
          {matches.length} / {all.length} icon. Nhấn vào một icon để sao chép
          tên dùng với <code>LUCIDE.</code>
        </Typography>
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
