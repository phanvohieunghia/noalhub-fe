import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NoalHub",
  slug: "noalhub-mobile",
  version: "0.1.0",
  platforms: ["ios", "android"],
  orientation: "portrait",
  scheme: "noalhub",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.noalhub.mobile",
    infoPlist: {
      NSAllowsLocalNetworking: true,
    },
  },
  android: {
    package: "com.noalhub.mobile",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-localization",
    "expo-notifications",
  ],
  extra: {
    // Falls back to LAN dev URL or environment EXPO_PUBLIC_API_BASE_URL
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3101",
    wsUrl: process.env.EXPO_PUBLIC_WS_URL,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
