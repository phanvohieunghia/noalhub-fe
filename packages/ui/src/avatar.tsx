"use client";

import { useTranslations } from "next-intl";
import { Avatar as RadixAvatar } from "radix-ui";

const SIZES = {
  sm: "size-8 text-body-4",
  md: "size-10 text-body-3",
  lg: "size-12 text-body-2",
} as const;

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

/** The initials of at most the first two words: "Nguyễn An" → "NA". */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * An image with an initials fallback, built on Radix Avatar: Radix tracks the
 * image's load state, so a broken or slow image falls back to the initials
 * instead of leaving a broken box — something a bare `<img>` cannot do.
 *
 * `aria-hidden` because an avatar always sits next to the name as text —
 * reading the name twice is noise for a screen reader.
 */
export function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const t = useTranslations("common.avatar");
  const label = name?.trim() || t("fallback");

  return (
    <RadixAvatar.Root
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10 font-medium select-none dark:bg-white/15 ${SIZES[size]} ${className}`}
    >
      {src ? (
        // Avatars come from arbitrary hosts (OAuth providers) → Radix renders a
        // plain <img> instead of next/image, so no remotePatterns entry is
        // needed per provider.
        <RadixAvatar.Image src={src} alt="" className="size-full object-cover" />
      ) : null}
      {/* delayMs=0: the fallback shows at once, no empty box flashing while the image loads. */}
      <RadixAvatar.Fallback delayMs={0}>{initials(label) || "?"}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
