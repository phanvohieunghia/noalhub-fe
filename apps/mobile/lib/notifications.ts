import type * as NotificationsModule from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { isSafeDeepLinkPath } from "./linking";

/**
 * `null` in Expo Go on Android: since SDK 53, merely importing expo-notifications
 * there throws, which took the whole root layout down. Loaded with `require` so the
 * import never runs in that case; everything below no-ops instead. Use the dev
 * build (`pnpm android`) to get notifications.
 */
const Notifications: typeof NotificationsModule | null =
  Platform.OS === "android" && isRunningInExpoGo()
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("expo-notifications");

// Configure how notifications are displayed when app is in foreground
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Push notification token stored in memory.
 */
let cachedPushToken: string | null = null;

export function getCachedPushToken(): string | null {
  return cachedPushToken;
}

/**
 * Create the Android channel and ask for permission. Kept separate from push-token
 * acquisition so local notifications also work on simulators/emulators, where
 * `Device.isDevice` is false and no push token can be issued.
 */
async function ensureNotificationPermissionAsync(): Promise<boolean> {
  if (!Notifications || Platform.OS === "web") {
    return false;
  }

  // Android 8+ drops notifications posted to a channel that does not exist, and
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0ABAB5",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted" && __DEV__) {
    console.warn("[PushNotifications] Permission not granted for push notifications.");
  }
  return status === "granted";
}

/**
 * Register for remote push notifications.
 * Requests user permissions, creates Android channel, and acquires device/Expo push token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Notifications || !(await ensureNotificationPermissionAsync())) {
      return null;
    }

    if (!Device.isDevice) {
      if (__DEV__) {
        console.log("[PushNotifications] Running on simulator/emulator. Push tokens require physical device.");
      }
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    // getExpoPushTokenAsync throws without a project id; say why instead.
    if (!projectId) {
      if (__DEV__) {
        console.warn("[PushNotifications] EAS project id is missing from app.config.ts; skipping push token.");
      }
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    cachedPushToken = tokenData.data;

    if (__DEV__) {
      console.log("[PushNotifications] Registered Expo Push Token:", cachedPushToken);
    }

    return cachedPushToken;
  } catch (error) {
    if (__DEV__) {
      console.warn("[PushNotifications] Failed to acquire push token:", error);
    }
    return null;
  }
}

/**
 * Helper to dispatch a local test notification.
 */
export async function sendLocalNotification(params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  if (!Notifications || !(await ensureNotificationPermissionAsync())) {
    throw new Error("Notification permission not granted");
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data ?? {},
    },
    trigger: null, // deliver immediately
  });
}

/**
 * React hook to observe notification events and route users appropriately.
 * Handles both background/killed tap and foreground responses.
 */
export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    if (!Notifications) return;

    // 1. Check if the app was opened by tapping a notification while closed/killed
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap(response);
        // The last response survives re-mounts; clear it so we don't navigate again.
        void Notifications.clearLastNotificationResponseAsync();
      }
    });

    // 2. Listen for notification tap events while app is running
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationTap(response);
      },
    );

    // 3. Foreground notification received listener
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (__DEV__) {
          console.log("[PushNotifications] Notification received in foreground:", notification);
        }
      },
    );

    function handleNotificationTap(response: NotificationsModule.NotificationResponse) {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (!data) return;

      // URL-based routing
      if (typeof data.url === "string" && isSafeDeepLinkPath(data.url)) {
        router.push(data.url as any);
        return;
      }

      // Feature-based payload routing
      if (typeof data.conversationId === "string" && data.conversationId) {
        router.push(`/chat/${data.conversationId}` as any);
        return;
      }

      if (typeof data.username === "string" && data.username) {
        router.push(`/profile/${data.username}` as any);
        return;
      }

      if (typeof data.slug === "string" && data.slug) {
        router.push(`/blog/${data.slug}` as any);
        return;
      }
    }

    return () => {
      responseListener.remove();
      receivedListener.remove();
    };
  }, [router]);
}
