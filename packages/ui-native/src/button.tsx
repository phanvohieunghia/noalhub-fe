import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
};

const VARIANT_CONTAINER_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary border-primary",
  secondary: "bg-muted border-muted",
  outline: "bg-surface border-border",
  ghost: "bg-transparent border-transparent",
  danger: "bg-danger border-danger",
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  danger: "text-primary-foreground",
};

const SIZE_CONTAINER_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 rounded-lg",
  md: "h-11 px-4 rounded-xl",
  // Tailwind v3 (NativeWind) has no h-13 — an unknown class is dropped and the
  // button collapses to its text height.
  lg: "h-14 px-5 rounded-2xl",
  icon: "h-10 w-10 p-0 rounded-xl",
};

const SIZE_TEXT_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs font-semibold",
  md: "text-sm font-semibold",
  lg: "text-base font-semibold",
  icon: "text-sm font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  textClassName = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const containerClass = `flex-row items-center justify-center border ${VARIANT_CONTAINER_CLASSES[variant]} ${SIZE_CONTAINER_CLASSES[size]} ${
    isDisabled ? "opacity-60" : "active:opacity-80"
  } ${className}`;

  const textClass = `${VARIANT_TEXT_CLASSES[variant]} ${SIZE_TEXT_CLASSES[size]} ${textClassName}`;

  return (
    <TouchableOpacity
      className={containerClass}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#009a9a" : "#ffffff"}
        />
      ) : typeof children === "string" ? (
        <Text className={textClass}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
