import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useAuthStore, useLogout, useMe } from "@noalhub/api/auth";
import { useChangeLanguage, useChangeUsername } from "@noalhub/api/users";
import { useUploadMedia } from "@noalhub/api/media";
import { Avatar, Badge, Button } from "@noalhub/ui-native";
import { useDateFormat, useLocaleStore, useMessage, type SupportedLocale } from "../../lib/i18n";
import { pickImage } from "../../lib/media";
import { BackButton } from "../../components/back-button";

export default function MyProfileScreen() {
  const router = useRouter();
  const tProfile = useTranslations("web.profile");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tDash = useTranslations("web.dashboard");
  const m = useMessage();
  const { formatDate } = useDateFormat();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const user = useAuthStore((s) => s.user);
  const { data: meData, refetch: refetchMe, isFetching } = useMe();
  const currentUser = meData ?? user;

  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: changeUsername, isPending: isChangingUsername } = useChangeUsername();
  const { mutate: changeLanguage, isPending: isChangingLanguage } = useChangeLanguage();
  const { mutateAsync: uploadMedia, isPending: isUploadingAvatar } = useUploadMedia({
    allow: ["image/jpeg", "image/png", "image/webp"],
  });

  // Username change modal state
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handlePickAvatar = async () => {
    try {
      const file = await pickImage();
      if (!file) return;

      const previewUri = "uri" in file ? file.uri : "";
      if (previewUri) setAvatarPreview(previewUri);
      const asset = await uploadMedia(file);
      // Backend avatar is uploaded
      setAvatarPreview(asset.url);
      void refetchMe();
    } catch {
      // Revert if failed
      setAvatarPreview(null);
    }
  };

  const handleChangeUsername = () => {
    const clean = newUsername.trim();
    if (!clean) return;
    setUsernameError(null);

    changeUsername(
      { username: clean },
      {
        onSuccess: () => {
          setUsernameModalVisible(false);
          setNewUsername("");
        },
        onError: (err) => {
          setUsernameError(err instanceof Error ? err.message : "common.errors.unknown");
        },
      },
    );
  };

  // Optimistic: switch the UI now, persist to the account in the background
  // (docs/i18n.md §4.2).
  const handleSelectLanguage = (lang: SupportedLocale) => {
    if (lang === locale) return;
    setLocale(lang);
    changeLanguage({ language: lang });
  };

  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-base text-muted-foreground mb-4">
          {tDash("mobileApp.guestDescription")}
        </Text>
        <Button onPress={() => router.push("/(auth)/login")}>
          {tNav("login")}
        </Button>
      </SafeAreaView>
    );
  }

  const currentAvatar = avatarPreview || currentUser.avatarUrl;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 py-3.5">
        <View className="flex-row items-center gap-2.5">
          <BackButton />
          <Text className="text-xl font-bold text-foreground">
            {tProfile("title")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => void refetchMe()}
          className="p-1 active:opacity-70"
          disabled={isFetching}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color="#009a9a" />
          ) : (
            <Text className="text-xs text-primary font-medium">Làm mới</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
        {/* User Card */}
        <View className="items-center rounded-2xl border border-border bg-surface p-6 mb-6 shadow-sm">
          <View className="relative mb-4">
            <Avatar
              src={currentAvatar}
              name={currentUser.displayName || currentUser.username}
              size="lg"
            />
            <TouchableOpacity
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary items-center justify-center shadow-md active:opacity-85"
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs text-primary-foreground font-bold">📷</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-xl font-bold text-foreground">
            {currentUser.displayName || currentUser.username}
          </Text>
          <Text className="text-sm text-muted-foreground mt-0.5 mb-2">
            @{currentUser.username}
          </Text>

          <View className="flex-row gap-2 mt-1">
            <Badge variant={currentUser.role === "admin" ? "danger" : "primary"}>
              {currentUser.role === "admin"
                ? tProfile("facts.admin")
                : tProfile("facts.member")}
            </Badge>
            <Badge variant={currentUser.emailVerified ? "success" : "warning"}>
              {currentUser.emailVerified
                ? tProfile("facts.verified")
                : tProfile("facts.unverified")}
            </Badge>
          </View>
        </View>

        {/* Account Details */}
        <View className="rounded-2xl border border-border bg-surface p-5 mb-6 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Thông tin tài khoản
          </Text>

          <View className="gap-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-border/50">
              <Text className="text-sm text-muted-foreground">{tProfile("facts.email")}</Text>
              <Text className="text-sm font-medium text-foreground">{currentUser.email}</Text>
            </View>

            <View className="flex-row items-center justify-between pb-3 border-b border-border/50">
              <Text className="text-sm text-muted-foreground">{tProfile("username.label")}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-foreground">@{currentUser.username}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setNewUsername(currentUser.username);
                    setUsernameModalVisible(true);
                  }}
                  className="rounded-md bg-muted px-2 py-1"
                >
                  <Text className="text-xs text-primary font-medium">Sửa</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-between pb-3 border-b border-border/50">
              <Text className="text-sm text-muted-foreground">{tProfile("facts.joined")}</Text>
              <Text className="text-sm font-medium text-foreground">
                {formatDate(currentUser.createdAt)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">User ID</Text>
              <Text className="text-xs font-mono text-muted-foreground" numberOfLines={1}>
                {currentUser.id.substring(0, 16)}...
              </Text>
            </View>
          </View>
        </View>

        {/* Language Selection */}
        <View className="rounded-2xl border border-border bg-surface p-5 mb-6 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {tNav("languageSwitcher.label")}
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleSelectLanguage("vi")}
              disabled={isChangingLanguage}
              className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                locale === "vi"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  locale === "vi" ? "text-primary" : "text-foreground"
                }`}
              >
                🇻🇳 {tNav("languageSwitcher.vi")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelectLanguage("en")}
              disabled={isChangingLanguage}
              className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                locale === "en"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  locale === "en" ? "text-primary" : "text-foreground"
                }`}
              >
                🇬🇧 {tNav("languageSwitcher.en")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => logout()}
          disabled={isLoggingOut}
          className="h-12 rounded-xl bg-danger/10 border border-danger/20 items-center justify-center active:opacity-85 shadow-xs mb-8"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#b42318" />
          ) : (
            <Text className="text-sm font-semibold text-danger">
              {tCommon("actions.logout") || "Đăng xuất"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Change Username Modal */}
      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <Text className="text-lg font-bold text-foreground mb-1">
              {tProfile("username.heading")}
            </Text>
            <Text className="text-xs text-muted-foreground mb-4">
              {tProfile("username.hint")}
            </Text>

            {usernameError && (
              <View className="rounded-lg bg-danger/10 border border-danger/20 p-3 mb-3">
                <Text className="text-xs text-danger">{m(usernameError)}</Text>
              </View>
            )}

            <TextInput
              className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground mb-4"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="new-username"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setUsernameModalVisible(false)}
                className="flex-1 h-11 rounded-xl border border-border items-center justify-center"
              >
                <Text className="text-sm font-medium text-foreground">
                  {tCommon("actions.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangeUsername}
                disabled={isChangingUsername}
                className="flex-1 h-11 rounded-xl bg-primary items-center justify-center shadow-xs"
              >
                {isChangingUsername ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-sm font-semibold text-primary-foreground">
                    {tProfile("username.submit")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
