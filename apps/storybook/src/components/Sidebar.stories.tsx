import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Sidebar, type SidebarItem } from "@noalhub/ui/sidebar";
import { Typography } from "@noalhub/ui/typography";

const PATHS = [
  "/overview",
  "/users",
  "/posts",
  "/posts/categories",
  "/posts/slugs",
  "/qa/datasets",
  "/qa/sets",
  "/qa/templates",
  "/storybook",
] as const;

const meta: Meta<typeof Sidebar> = {
  title: "UI/Navigation/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
  argTypes: {
    rail: { control: "boolean", description: "Thu gọn thành thanh icon" },
    pathname: {
      control: "select",
      options: PATHS,
      description: "Đường dẫn hiện tại; dòng khớp dài nhất sẽ sáng lên",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

/** The admin app's real navigation, with the labels translated like the app does. */
function useItems(): SidebarItem[] {
  const ta = useTranslations("nav.admin");
  return [
    { href: "/overview", label: ta("items.overview"), icon: LUCIDE.layoutDashboard },
    { href: "/users", label: ta("items.users"), icon: ICONS.users },
    {
      href: "/posts",
      label: ta("items.posts"),
      icon: LUCIDE.newspaper,
      children: [
        { href: "/posts/categories", label: ta("items.categories") },
        { href: "/posts/slugs", label: ta("items.slugs") },
      ],
    },
    {
      href: "/qa/datasets",
      label: ta("items.qa"),
      icon: LUCIDE.circleQuestionMark,
      children: [
        { href: "/qa/sets", label: ta("items.qaSets") },
        { href: "/qa/items", label: ta("items.qaItems") },
      ],
    },
    {
      href: "/qa/templates",
      label: ta("items.ai"),
      icon: LUCIDE.sparkles,
      children: [
        { href: "/qa/templates", label: ta("items.qaTemplates") },
        {
          href: "/qa/credentials",
          label: ta("items.qaCredentials"),
          locked: true,
          lockedReason: ta("disabled.requiresSuperAdmin"),
        },
        {
          href: "/qa/models",
          label: ta("items.qaModels"),
          locked: true,
          lockedReason: ta("disabled.requiresSuperAdmin"),
        },
      ],
    },
    { href: "/storybook", label: ta("items.storybook"), icon: ICONS.palette },
    {
      href: "/conversations",
      label: ta("items.conversations"),
      icon: LUCIDE.messagesSquare,
      locked: true,
      lockedReason: ta("disabled.conversations"),
    },
    {
      href: "/reports",
      label: ta("items.reports"),
      icon: LUCIDE.flag,
      locked: true,
      lockedReason: ta("disabled.reports"),
    },
  ];
}

/** Longest matching href wins, so a nested screen lights up only its own row. */
function activeFor(pathname: string, items: SidebarItem[]) {
  let best: string | undefined;
  for (const item of items.flatMap((i) => [i, ...(i.children ?? [])])) {
    if ((pathname === item.href || pathname.startsWith(`${item.href}/`)) && (!best || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

function Demo({ pathname, rail: initialRail }: { pathname: string; rail: boolean }) {
  const t = useTranslations("nav");
  const ta = useTranslations("nav.admin");
  const items = useItems();
  const [rail, setRail] = useState(initialRail);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [current, setCurrent] = useState(pathname);

  return (
    <div className="flex h-[640px] bg-background">
      <Sidebar
        brand={{ title: t("adminBrand"), subtitle: t("adminSubtitle") }}
        items={items}
        pathname={current}
        activeHref={activeFor(current, items)}
        collapsedGroups={collapsed}
        onToggleGroup={(href) =>
          setCollapsed((c) => (c.includes(href) ? c.filter((h) => h !== href) : [...c, href]))
        }
        rail={rail}
        onToggleRail={() => setRail((r) => !r)}
        labels={{
          nav: ta("mainNav"),
          expandSidebar: ta("expandSidebar"),
          collapseSidebar: ta("collapseSidebar"),
          group: (open, section) => ta(open ? "collapseGroup" : "expandGroup", { section }),
        }}
      />
      <main className="flex-1 p-6">
        <Typography variant="body-3" className="text-muted-foreground">
          {current}
        </Typography>
        <div className="mt-3 flex flex-wrap gap-2">
          {PATHS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrent(p)}
              aria-pressed={current === p}
              className="rounded-md border border-border px-2 py-1 text-body-4 text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {p}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

/** Pick a path on the right to move the highlight; chevrons collapse groups; the top-right button shrinks to a rail. */
export const Default: Story = {
  args: { pathname: "/overview", rail: false },
  render: (args) => <Demo key={`${args.pathname}${args.rail}`} pathname={args.pathname} rail={args.rail} />,
};

/** A nested screen lights up only its own row; its group stays open and cannot be collapsed. */
export const NestedActive: Story = {
  args: { pathname: "/posts/slugs", rail: false },
  render: (args) => <Demo key={`${args.pathname}${args.rail}`} pathname={args.pathname} rail={args.rail} />,
};

/** Icon-only. Hover a group icon for a flyout of its children; locked rows explain why in a tooltip. */
export const Rail: Story = {
  args: { pathname: "/qa/sets", rail: true },
  render: (args) => <Demo key={`${args.pathname}${args.rail}`} pathname={args.pathname} rail={args.rail} />,
};
