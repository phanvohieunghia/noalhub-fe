import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { usePublicProfile } from "@noalhub/api/users";
import {
  useAcceptFriendRequest,
  useFriendRequests,
  useFriends,
  useRemoveFriendRequest,
  useSendFriendRequest,
} from "@noalhub/api/friends";
import { useCreateDirectConversation } from "@noalhub/api/chat";
import { useAuthStore } from "@noalhub/api/auth";
import { Avatar, Button } from "@noalhub/ui-native";
import { BackButton } from "../../components/back-button";

export default function PublicProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const tProfile = useTranslations("web.profile");
  const tFriends = useTranslations("web.friends");

  const currentUsername = useAuthStore((s) => s.user?.username);
  const isMe = currentUsername === username;

  const { data: profile, isLoading, isError, refetch } = usePublicProfile(username);
  const { data: friendsData } = useFriends();
  const { data: incomingData } = useFriendRequests("incoming");
  const { data: outgoingData } = useFriendRequests("outgoing");

  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptFriendRequest();
  const { mutate: removeRequest, isPending: isRemoving } = useRemoveFriendRequest();
  const { mutate: createChat, isPending: isCreatingChat } = useCreateDirectConversation();

  const isFriend = friendsData?.items.some((f) => f.user.username === username);
  const isOutgoing = outgoingData?.items.some((r) => r.user.username === username);
  const isIncoming = incomingData?.items.some((r) => r.user.username === username);

  const handleStartChat = () => {
    if (!profile?.id) return;
    createChat(profile.id, {
      onSuccess: (conv) => {
        router.push(`/chat/${conv.id}`);
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 py-3.5">
        <View className="flex-row items-center gap-2.5">
          <BackButton />
          <Text className="text-xl font-bold text-foreground">
            @{username}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#009a9a" />
        </View>
      ) : isError || !profile ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-4xl mb-3">🔍</Text>
          <Text className="text-base font-semibold text-foreground mb-1 text-center">
            {tProfile("public.notFound", { username: username ?? "" })}
          </Text>
          <Button variant="outline" onPress={() => router.back()} className="mt-4">
            Quay lại
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24 }} className="flex-1">
          <View className="items-center rounded-2xl border border-border bg-surface p-6 shadow-sm mb-6">
            <Avatar
              src={profile.avatarUrl}
              name={profile.displayName || profile.username}
              size="lg"
              className="mb-4"
            />
            <Text className="text-2xl font-bold text-foreground">
              {profile.displayName || profile.username}
            </Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              @{profile.username}
            </Text>

            {/* Actions */}
            <View className="w-full flex-row gap-3 mt-6">
              {!isMe && (
                <>
                  <TouchableOpacity
                    onPress={handleStartChat}
                    disabled={isCreatingChat}
                    className="flex-1 h-12 rounded-xl bg-primary items-center justify-center active:opacity-85 shadow-xs"
                  >
                    {isCreatingChat ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text className="text-sm font-semibold text-primary-foreground">
                        💬 {tProfile("public.message")}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {isFriend ? (
                    <View className="h-12 px-4 rounded-xl bg-success/15 items-center justify-center">
                      <Text className="text-xs font-semibold text-success">
                        ✓ Bạn bè
                      </Text>
                    </View>
                  ) : isOutgoing ? (
                    <TouchableOpacity
                      onPress={() => removeRequest(profile.username)}
                      disabled={isRemoving}
                      className="h-12 px-4 rounded-xl border border-border bg-surface items-center justify-center"
                    >
                      <Text className="text-xs font-medium text-muted-foreground">
                        Huỷ yêu cầu
                      </Text>
                    </TouchableOpacity>
                  ) : isIncoming ? (
                    <TouchableOpacity
                      onPress={() => acceptRequest(profile.username)}
                      disabled={isAccepting}
                      className="h-12 px-4 rounded-xl bg-primary items-center justify-center shadow-xs"
                    >
                      <Text className="text-xs font-semibold text-primary-foreground">
                        {tFriends("requests.accept")}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => sendRequest(profile.username)}
                      disabled={isSending}
                      className="h-12 px-4 rounded-xl border border-primary bg-primary/10 items-center justify-center"
                    >
                      <Text className="text-xs font-semibold text-primary">
                        + Kết bạn
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
