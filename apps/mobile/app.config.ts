import type { ConfigContext, ExpoConfig } from "expo/config";

// Not a secret: it ships inside every bundle. Kept as a literal so `eas update`
// does not depend on an env var being set in the shell that runs it.
const EAS_PROJECT_ID = "685744ca-643b-49e8-a59a-fd9b241f1f31";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NoalHub",
  slug: "noalhub-mobile",
  version: "0.1.0",
  platforms: ["ios", "android"],
  orientation: "portrait",
  scheme: "noalhub",
  // Expo Go only accepts updates whose runtime is `exposdk:<its SDK>`, so this
  // must track the `expo` major in package.json. Switch to a build-based policy
  // (e.g. `{ policy: "fingerprint" }`) before shipping standalone/dev builds.
  runtimeVersion: "exposdk:57.0.0",
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
  },
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
      projectId: EAS_PROJECT_ID,
    },
  },
});
