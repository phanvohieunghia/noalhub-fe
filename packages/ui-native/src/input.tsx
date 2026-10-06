import React, { forwardRef } from "react";
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  helperText?: string;
  rightAccessory?: React.ReactNode;
  containerClassName?: string;
  className?: string;
};

export const Input = forwardRef<any, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    rightAccessory,
    containerClassName = "",
    className = "",
    ...props
  },
  ref,
) {
  const hasError = Boolean(error);

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1.5">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center h-12 rounded-xl border bg-surface px-4 ${
          hasError
            ? "border-danger"
            : "border-border"
        }`}
      >
        <TextInput
          ref={ref}
          className={`flex-1 text-base text-foreground ${className}`}
          placeholderTextColor="#95a1a2"
          {...props}
        />
        {rightAccessory && <View className="ml-2">{rightAccessory}</View>}
      </View>

      {hasError ? (
        <Text className="text-xs text-danger mt-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-muted-foreground mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
});
