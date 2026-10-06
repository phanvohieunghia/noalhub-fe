import React from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { Icon } from "@noalhub/ui-native";

/**
 * The back control every screen header starts with. A 40dp round hit target —
 * a bare glyph was ~16dp wide and easy to miss — with a lucide arrow and a
 * spoken label, since the icon alone says nothing to a screen reader.
 *
 * `onPress` overrides the default pop, for screens where popping would land
 * somewhere stale (e.g. back from a review onto a finished attempt).
 */
export function BackButton({
  onPress,
  className = "",
}: {
  onPress?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={t("actions.back")}
      hitSlop={4}
      className={`-ml-2 h-10 w-10 items-center justify-center rounded-full active:bg-muted ${className}`}
    >
      <Icon name="arrowLeft" size={22} className="text-foreground" />
    </Pressable>
  );
}
