import React from "react";
import { Image, Text, View } from "react-native";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type PresenceStatus = "online" | "offline" | "away";

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  presence?: PresenceStatus | null;
  className?: string;
};

const SIZE_CLASSES: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  sm: { box: "h-8 w-8 rounded-full", text: "text-xs", dot: "h-2 w-2 right-0 bottom-0" },
  md: { box: "h-10 w-10 rounded-full", text: "text-sm", dot: "h-2.5 w-2.5 right-0 bottom-0" },
  lg: { box: "h-12 w-12 rounded-full", text: "text-base", dot: "h-3 w-3 right-0.5 bottom-0.5" },
  xl: { box: "h-16 w-16 rounded-full", text: "text-xl", dot: "h-3.5 w-3.5 right-1 bottom-1" },
};

const PRESENCE_CLASSES: Record<PresenceStatus, string> = {
  online: "bg-success border-surface",
  away: "bg-warning border-surface",
  offline: "bg-neutral-400 border-surface",
};

export function Avatar({
  src,
  name,
  size = "md",
  presence,
  className = "",
}: AvatarProps) {
  const sizeConfig = SIZE_CLASSES[size];

  const getInitials = (n?: string | null) => {
    if (!n) return "?";
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <View className={`relative ${sizeConfig.box} ${className}`}>
      {src ? (
        <Image
          source={{ uri: src }}
          className={`${sizeConfig.box} bg-muted`}
          resizeMode="cover"
        />
      ) : (
        <View
          className={`${sizeConfig.box} bg-primary/20 items-center justify-center border border-primary/30`}
        >
          <Text className={`font-semibold text-primary ${sizeConfig.text}`}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {presence && (
        <View
          className={`absolute rounded-full border-2 ${sizeConfig.dot} ${PRESENCE_CLASSES[presence]}`}
        />
      )}
    </View>
  );
}
