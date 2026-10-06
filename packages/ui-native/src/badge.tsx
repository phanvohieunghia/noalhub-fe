import React from "react";
import { Text, View, type ViewProps } from "react-native";

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
};

const VARIANT_CONTAINER: Record<BadgeVariant, string> = {
  primary: "bg-primary/15 border-primary/20",
  success: "bg-success/15 border-success/20",
  warning: "bg-warning/15 border-warning/20",
  danger: "bg-danger/15 border-danger/20",
  neutral: "bg-muted border-border",
};

const VARIANT_TEXT: Record<BadgeVariant, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted-foreground",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
  textClassName = "",
  ...props
}: BadgeProps) {
  return (
    <View
      className={`self-start flex-row items-center rounded-full border px-2.5 py-0.5 ${VARIANT_CONTAINER[variant]} ${className}`}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className={`text-xs font-medium ${VARIANT_TEXT[variant]} ${textClassName}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
