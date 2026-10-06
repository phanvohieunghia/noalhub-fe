import "../lib/crypto-polyfill";
import "../global.css";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import * as Device from "expo-device";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IntlProvider } from "use-intl";
import Constants from "expo-constants";

import { AppState, type AppStateStatus } from "react-native";
import { setStorage } from "@noalhub/api/storage";
import { configureApi } from "@noalhub/api/config";
import { useAuthStore, ensureAccessToken } from "@noalhub/api/auth";
import { disconnectChatSocket } from "@noalhub/api/chat";
import { initStorage, secureStorageAdapter } from "../lib/storage";
import { getInitialLocale, messages, useLocaleStore } from "../lib/i18n";
import { useDeepLinkHandler } from "../lib/linking";
import {
  registerForPushNotificationsAsync,
  useNotificationObserver,
} from "../lib/notifications";

// Wire the storage adapter into @noalhub/api
setStorage(secureStorageAdapter);

/**
 * Inside the Android emulator, `localhost` is the emulator itself; the Mac is
 * `10.0.2.2`. Rewrite so the same `.env.local` works for the iOS simulator and the
 * Android emulator without `adb reverse`. Physical devices still need the LAN IP.
 */
function forEmulator(url: string | undefined): string | undefined {
  if (!url || Platform.OS !== "android" || Device.isDevice) return url;
  return url.replace(
    /^(\w+:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/,
    (_, scheme: string) => `${scheme}10.0.2.2`,
  );
}

// Configure backend origin for API and WebSocket
const extra = Constants.expoConfig?.extra;
const apiOrigin = forEmulator(
  process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra?.apiBaseUrl ??
    "http://localhost:3101",
)!;
const wsUrl = forEmulator(process.env.EXPO_PUBLIC_WS_URL ?? extra?.wsUrl);

configureApi({ apiOrigin, wsUrl });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function NavigationAndPushListeners() {
  useDeepLinkHandler();
  useNotificationObserver();

  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (status === "authenticated") {
      void registerForPushNotificationsAsync();
    }
  }, [status]);

  // After bootstrap/login, the user's saved language wins over the device cache
  // (docs/i18n.md §4.2). Keyed on the user id, not on `user.language`: a switch in
  // the profile is applied optimistically before PATCH returns, and re-running here
  // with the stale value would revert it.
  useEffect(() => {
    const language = useAuthStore.getState().user?.language;
    if (status === "authenticated" && language && language !== useLocaleStore.getState().locale) {
      useLocaleStore.getState().setLocale(language);
    }
  }, [status, userId]);

  return null;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initStorage();
        useLocaleStore.getState().setLocale(getInitialLocale());
        await useAuthStore.getState().bootstrap();
      } finally {
        setIsReady(true);
      }
    }
    void bootstrap();
  }, []);

  // Handle app lifecycle for socket & token refresh (docs/mobile.md §5.4)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          if (useAuthStore.getState().status === "authenticated") {
            void ensureAccessToken();
          }
        } else if (nextState === "background") {
          disconnectChatSocket();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0ABAB5" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <IntlProvider
          locale={locale}
          messages={messages[locale]}
          onError={(error) => {
            if (__DEV__) {
              console.warn(`[i18n] ${error.message}`);
            }
          }}
          getMessageFallback={({ key, namespace }) => {
            return namespace ? `${namespace}.${key}` : key;
          }}
        >
          <StatusBar style="auto" />
          <NavigationAndPushListeners />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </IntlProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
