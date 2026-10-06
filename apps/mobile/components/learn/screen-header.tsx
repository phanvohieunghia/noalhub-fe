import React from "react";
import { Text, View } from "react-native";

import { BackButton } from "../back-button";

/**
 * The bar every learn screen opens with. `onBack` overrides the default pop —
 * the review screen goes to the browse list instead, since popping would land
 * back on a finished attempt.
 */
export function LearnHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 py-3.5">
      <View className="mr-3 flex-1 flex-row items-center gap-2.5">
        <BackButton onPress={onBack} />
        <Text className="flex-1 text-base font-bold text-foreground" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
