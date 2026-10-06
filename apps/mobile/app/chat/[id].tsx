import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLocale, useTranslations } from "use-intl";

import {
  useConversation,
  useEphemeralStore,
  useMessages,
  useSendMessage,
  type Message,
} from "@noalhub/api/chat";
import { useAuthStore } from "@noalhub/api/auth";
import { conversationName, otherMember } from "@noalhub/core/chat/format";
import { Avatar } from "@noalhub/ui-native";
import { BackButton } from "../../components/back-button";

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tChat = useTranslations("web.chat");
  const locale = useLocale();
  const tCommon = useTranslations("common");

  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const { data: conv, isLoading: isLoadingConv } = useConversation(id);
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(id);

  const { mutate: sendMessage, isPending: isSending } = useSendMessage(id ?? "");

  const presenceByUser = useEphemeralStore((s) => s.presenceByUser);
  const typingByConversation = useEphemeralStore((s) => s.typingByConversation);

  const [inputBody, setInputBody] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  // Flatten messages: the backend sends items "newest first"
  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.items) ?? [],
    [messagesData],
  );

  const other = conv ? otherMember(conv, currentUserId) : null;
  const convTitleObj = conv ? conversationName(conv, currentUserId) : null;
  const peerName =
    convTitleObj && "name" in convTitleObj ? convTitleObj.name : "Trò chuyện";
  const peerPresence = other ? presenceByUser[other.userId] : null;
  const isPeerTyping = Boolean(id && (typingByConversation[id]?.length ?? 0) > 0);

  const handleSend = () => {
    const text = inputBody.trim();
    if (!text || isSending) return;
    setInputBody("");
    sendMessage({ body: text });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
        <BackButton className="mr-1" />

        <Avatar
          src={other?.avatarUrl}
          name={peerName}
          size="md"
          presence={peerPresence?.status ?? (other?.status as any)}
          className="mr-3"
        />

        <View className="flex-1 justify-center">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {peerName}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {isPeerTyping
              ? tChat("typing.someone")
              : peerPresence?.status === "online"
                ? tChat("presence.online")
                : tChat("presence.offline")}
          </Text>
        </View>
      </View>

      {/* Main Chat Body with Inverted Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        className="flex-1"
      >
        {isLoadingConv || isLoadingMessages ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#009a9a" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            inverted
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-2 items-center">
                  <ActivityIndicator size="small" color="#009a9a" />
                </View>
              ) : undefined
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId;
              const isFailed = item.status === "failed";
              const isSendingMsg = item.status === "sending";

              if (item.type === "system") {
                return (
                  <View className="my-2 items-center">
                    <Text className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                      {item.body}
                    </Text>
                  </View>
                );
              }

              return (
                <View
                  className={`my-1 flex-row ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <View
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? isFailed
                          ? "bg-danger/10 border border-danger/40"
                          : "bg-primary"
                        : "bg-surface border border-border/80"
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        isMe
                          ? isFailed
                            ? "text-danger"
                            : "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.body}
                    </Text>

                    <View className="flex-row items-center justify-end gap-1 mt-1">
                      <Text
                        className={`text-[10px] ${
                          isMe
                            ? isFailed
                              ? "text-danger/80"
                              : "text-primary-foreground/75"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(item.createdAt).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>

                      {isSendingMsg && (
                        <Text className="text-[10px] text-primary-foreground/70">
                          • Đang gửi…
                        </Text>
                      )}

                      {isFailed && (
                        <TouchableOpacity
                          onPress={() =>
                            sendMessage({ id: item.id, body: item.body })
                          }
                          className="ml-1"
                        >
                          <Text className="text-[10px] font-bold text-danger underline">
                            Thử lại
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Typing indicator banner */}
        {isPeerTyping && (
          <View className="px-5 py-1 bg-background/80">
            <Text className="text-xs italic text-muted-foreground">
              {peerName} đang soạn tin…
            </Text>
          </View>
        )}

        {/* Message Input Composer */}
        <View className="flex-row items-center border-t border-border bg-surface px-4 py-3 gap-2.5">
          <TextInput
            className="flex-1 max-h-28 min-h-11 rounded-2xl border border-border bg-background px-4 py-2.5 text-base text-foreground"
            placeholder={tChat("composer.placeholder") || "Nhập tin nhắn…"}
            placeholderTextColor="#95a1a2"
            multiline
            value={inputBody}
            onChangeText={setInputBody}
          />

          <TouchableOpacity
            className={`h-11 w-11 rounded-full items-center justify-center active:opacity-80 ${
              inputBody.trim() ? "bg-primary" : "bg-muted"
            }`}
            onPress={handleSend}
            disabled={!inputBody.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text
                className={`text-base font-bold ${
                  inputBody.trim() ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                ↑
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
