import React from "react";
import { Stack } from "expo-router";

export default function BlogLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
