import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale, useTranslations } from "use-intl";

import {
  useChatSocket,
  useConversations,
  useCreateDirectConversation,
  useEphemeralStore,
} from "@noalhub/api/chat";
import { useAuthStore } from "@noalhub/api/auth";
import { conversationName, otherMember } from "@noalhub/core/chat/format";
import { Avatar, Badge, Button } from "@noalhub/ui-native";
import { BackButton } from "../../components/back-button";

export default function ConversationListScreen() {
  const router = useRouter();
  const tChat = useTranslations("web.chat");
  const locale = useLocale();
  const tCommon = useTranslations("common");

  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const { status: socketStatus } = useChatSocket();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversations();

  const presenceByUser = useEphemeralStore((s) => s.presenceByUser);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const { mutate: createDirect, isPending: isCreating } =
    useCreateDirectConversation();

  const conversations = data?.pages.flatMap((page) => page.items) ?? [];

  const handleCreateChat = () => {
    if (!targetUserId.trim()) return;
    createDirect(targetUserId.trim(), {
      onSuccess: (conv) => {
        setCreateModalVisible(false);
        setTargetUserId("");
        router.push(`/chat/${conv.id}`);
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 py-3.5">
        <View className="flex-row items-center gap-2.5">
          <BackButton />
          <Text className="text-xl font-bold text-foreground">
            {tChat("sidebar.title") || "Tin nhắn"}
          </Text>
          <View
            className={`h-2.5 w-2.5 rounded-full ${
              socketStatus === "online"
                ? "bg-success"
                : socketStatus === "connecting"
                  ? "bg-warning"
                  : "bg-danger"
            }`}
          />
        </View>

        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          className="rounded-lg bg-primary/10 px-3 py-1.5 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-primary">
            + {tCommon("actions.create") || "Mới"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversation List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#009a9a" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-base font-semibold text-foreground mb-1 text-center">
            {tChat("sidebar.empty")}
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            Bắt đầu nhắn tin với bạn bè ngay hôm nay.
          </Text>
          <Button onPress={() => setCreateModalVisible(true)}>
            + Nhắn tin mới
          </Button>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor="#009a9a"
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => {
            const other = otherMember(item, currentUserId);
            const conv = conversationName(item, currentUserId);
            const title = "name" in conv ? conv.name : "Người dùng";
            const peerPresence = other ? presenceByUser[other.userId] : null;

            return (
              <TouchableOpacity
                className="flex-row items-center border-b border-border/50 bg-surface px-5 py-3.5 active:bg-muted/40"
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <Avatar
                  src={other?.avatarUrl}
                  name={title}
                  size="md"
                  presence={peerPresence?.status ?? (other?.status as any)}
                  className="mr-3.5"
                />

                <View className="flex-1 justify-center mr-2">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text
                      className="text-base font-semibold text-foreground"
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    {item.lastMessage && (
                      <Text className="text-xs text-muted-foreground">
                        {new Date(item.lastMessage.createdAt).toLocaleTimeString(
                          locale,
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </Text>
                    )}
                  </View>

                  <Text
                    className={`text-sm ${
                      item.unreadCount > 0
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                    numberOfLines={1}
                  >
                    {item.lastMessage?.body || "Chưa có tin nhắn"}
                  </Text>
                </View>

                {item.unreadCount > 0 && (
                  <Badge variant="primary">{item.unreadCount.toString()}</Badge>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* New Conversation Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 p-5">
          <View className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-lg border border-border">
            <Text className="text-lg font-bold text-foreground mb-1">
              Bắt đầu trò chuyện
            </Text>
            <Text className="text-xs text-muted-foreground mb-4">
              Nhập User ID của người bạn muốn nhắn tin:
            </Text>

            <TextInput
              className="h-12 rounded-xl border border-border bg-background px-4 text-base text-foreground mb-5"
              placeholder="User ID (UUID)"
              placeholderTextColor="#95a1a2"
              autoCapitalize="none"
              value={targetUserId}
              onChangeText={setTargetUserId}
            />

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setCreateModalVisible(false)}
              >
                {tCommon("actions.cancel") || "Huỷ"}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={isCreating}
                disabled={!targetUserId.trim()}
                onPress={handleCreateChat}
              >
                Bắt đầu
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
