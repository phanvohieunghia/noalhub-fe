import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { getApiBaseUrl } from "@noalhub/api/config";
import { useAuthStore, useLogout, useMe } from "@noalhub/api/auth";
import { sendLocalNotification } from "../lib/notifications";

export default function HomeScreen() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("web.auth");
  const tDash = useTranslations("web.dashboard");

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: meData, refetch: refetchMe, isFetching: isFetchingMe } = useMe();
  const [notificationSent, setNotificationSent] = useState(false);

  const currentUser = meData ?? user;

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification({
        title: "NoalHub Mobile",
        body: tDash("mobileApp.testNotificationSent"),
        data: { url: "/chat" },
      });
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 3000);
    } catch (err) {
      if (__DEV__) {
        console.warn("[TestNotification] error:", err);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        className="flex-1"
      >
        {/* Logo & Header */}
        <View className="mb-6 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-sm mb-3">
            <Text className="text-2xl font-bold text-primary-foreground">NH</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">NoalHub Mobile</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {tDash("mobileApp.subtitle")}
          </Text>
        </View>

        {/* API Info Card */}
        <View className="rounded-xl border border-border bg-surface p-4 mb-5 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {tDash("mobileApp.backendOrigin")}
          </Text>
          <Text className="text-sm font-mono text-foreground">{getApiBaseUrl()}</Text>
        </View>

        {/* Auth State & Actions Card */}
        <View className="rounded-xl border border-border bg-surface p-4 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tDash("mobileApp.authSection")}
            </Text>
            <View
              className={`rounded-full px-2.5 py-0.5 ${
                status === "authenticated"
                  ? "bg-success/15"
                  : "bg-muted"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  status === "authenticated"
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                {status === "authenticated"
                  ? tDash("mobileApp.statusAuthenticated")
                  : tDash("mobileApp.statusGuest")}
              </Text>
            </View>
          </View>

          {status === "authenticated" && currentUser ? (
            <View className="gap-3">
              <View className="rounded-lg bg-muted/40 p-3">
                <Text className="text-base font-semibold text-foreground">
                  {currentUser.displayName || currentUser.username}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  @{currentUser.username} • {currentUser.email}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  {tDash("role", { role: currentUser.role })}
                </Text>
              </View>

              <View className="flex-row gap-3 mt-1">
                {/* Test protected query button */}
                <TouchableOpacity
                  className="flex-1 rounded-xl border border-border bg-surface py-2.5 items-center active:opacity-75"
                  onPress={() => void refetchMe()}
                  disabled={isFetchingMe}
                >
                  {isFetchingMe ? (
                    <ActivityIndicator size="small" color="#0ABAB5" />
                  ) : (
                    <Text className="text-xs font-semibold text-foreground">
                      {tDash("mobileApp.verifyAuth")}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                  className="flex-1 rounded-xl bg-danger/10 border border-danger/20 py-2.5 items-center active:opacity-75"
                  onPress={() => logout()}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#b42318" />
                  ) : (
                    <Text className="text-xs font-semibold text-danger">
                      {tCommon("actions.logout")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-sm text-muted-foreground mb-4">
                {tDash("mobileApp.guestDescription")}
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl bg-primary items-center justify-center active:opacity-85 shadow-sm"
                  onPress={() => router.push("/(auth)/login")}
                >
                  <Text className="text-sm font-semibold text-primary-foreground">
                    {tAuth("login.title")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl border border-border bg-surface items-center justify-center active:opacity-75"
                  onPress={() => router.push("/(auth)/register")}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    {tAuth("register.title")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions / Navigation Grid */}
        <View className="rounded-xl border border-border bg-surface p-4 mb-5 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {tDash("mobileApp.quickNav")}
          </Text>

          <View className="gap-2.5">
            {/* Chat */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-border/80 bg-background/50 p-3.5 active:opacity-75"
              onPress={() => router.push("/chat")}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">💬</Text>
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {tDash("chat")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {tDash("mobileApp.chatDesc")}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">→</Text>
            </TouchableOpacity>

            {/* Friends */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-border/80 bg-background/50 p-3.5 active:opacity-75"
              onPress={() => router.push("/friends")}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">👥</Text>
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {tDash("friends")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {tDash("mobileApp.friendsDesc")}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">→</Text>
            </TouchableOpacity>

            {/* Blog */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-border/80 bg-background/50 p-3.5 active:opacity-75"
              onPress={() => router.push("/blog")}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">📰</Text>
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {tDash("blog")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {tDash("mobileApp.blogDesc")}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">→</Text>
            </TouchableOpacity>

            {/* Learn */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-border/80 bg-background/50 p-3.5 active:opacity-75"
              onPress={() => router.push("/learn")}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">🎯</Text>
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {tDash("learn")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {tDash("mobileApp.learnDesc")}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">→</Text>
            </TouchableOpacity>

            {/* Profile */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-border/80 bg-background/50 p-3.5 active:opacity-75"
              onPress={() => router.push("/profile")}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">👤</Text>
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {tDash("profile")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {tDash("mobileApp.profileDesc")}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">→</Text>
            </TouchableOpacity>

            {/* Test Push / Local Notification */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 active:opacity-75"
              onPress={() => void handleTestNotification()}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">🔔</Text>
                <View>
                  <Text className="text-sm font-semibold text-primary">
                    {notificationSent
                      ? tDash("mobileApp.testNotificationSent")
                      : tDash("mobileApp.testNotification")}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {tDash("mobileApp.testNotificationDesc")}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-primary">⚡</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Roadmap Progress Card */}
        <View className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {tDash("mobileApp.roadmapTitle")}
          </Text>
          <View className="gap-2.5">
            <Text className="text-sm text-foreground">
              ✅ <Text className="font-semibold">{tDash("mobileApp.phase0")}</Text>
            </Text>
            <Text className="text-sm text-foreground">
              ✅ <Text className="font-semibold">{tDash("mobileApp.phase1")}</Text>
            </Text>
            <Text className="text-sm text-foreground">
              ✅ <Text className="font-semibold">{tDash("mobileApp.phase2")}</Text>
            </Text>
            <Text className="text-sm text-foreground">
              ✅ <Text className="font-semibold">{tDash("mobileApp.phase3")}</Text>
            </Text>
            <Text className="text-sm text-foreground">
              ✅ <Text className="font-semibold">{tDash("mobileApp.phase4")}</Text>
            </Text>
            <Text className="text-sm text-foreground">
              ✅ <Text className="font-semibold">{tDash("mobileApp.phase5")}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
