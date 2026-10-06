import React from "react";
import { ActivityIndicator, View, type ActivityIndicatorProps } from "react-native";

export type SpinnerProps = ActivityIndicatorProps & {
  className?: string;
};

export function Spinner({
  size = "small",
  color = "#009a9a",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} {...props} />
    </View>
  );
}
