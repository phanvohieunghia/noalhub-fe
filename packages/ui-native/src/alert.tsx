import React from "react";
import { Text, View, type ViewProps } from "react-native";

export type AlertVariant = "danger" | "success" | "warning" | "info";

export type AlertProps = ViewProps & {
  variant?: AlertVariant;
  title?: string;
  message?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

const VARIANT_CONTAINER: Record<AlertVariant, string> = {
  danger: "bg-danger/10 border-danger/30",
  success: "bg-success/10 border-success/30",
  warning: "bg-warning/10 border-warning/30",
  info: "bg-primary/10 border-primary/30",
};

const VARIANT_TITLE: Record<AlertVariant, string> = {
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning",
  info: "text-primary",
};

export function Alert({
  variant = "info",
  title,
  message,
  children,
  className = "",
  ...props
}: AlertProps) {
  return (
    <View
      className={`rounded-xl border p-4 ${VARIANT_CONTAINER[variant]} ${className}`}
      {...props}
    >
      {title && (
        <Text className={`text-sm font-semibold mb-1 ${VARIANT_TITLE[variant]}`}>
          {title}
        </Text>
      )}
      {message && typeof message === "string" ? (
        <Text className={`text-sm ${VARIANT_TITLE[variant]}`}>{message}</Text>
      ) : (
        message
      )}
      {children}
    </View>
  );
}
