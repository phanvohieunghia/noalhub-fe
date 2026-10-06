import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import {
  useAcceptFriendRequest,
  useFindUserByUsername,
  useFriendRequests,
  useFriends,
  useRemoveFriendRequest,
  useSendFriendRequest,
  useUnfriend,
} from "@noalhub/api/friends";
import { useCreateDirectConversation } from "@noalhub/api/chat";
import { useAuthStore } from "@noalhub/api/auth";
import { Avatar, Badge, Button } from "@noalhub/ui-native";
import { useMessage } from "../../lib/i18n";
import { BackButton } from "../../components/back-button";

type FriendsTab = "friends" | "requests" | "search";

export default function FriendsScreen() {
  const router = useRouter();
  const tFriends = useTranslations("web.friends");
  const tCommon = useTranslations("common");
  const m = useMessage();

  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");
  const currentUsername = useAuthStore((s) => s.user?.username);

  // Queries
  const {
    data: friendsData,
    isLoading: isLoadingFriends,
    refetch: refetchFriends,
    isRefetching: isRefetchingFriends,
  } = useFriends();

  const {
    data: incomingData,
    isLoading: isLoadingIncoming,
    refetch: refetchIncoming,
    isRefetching: isRefetchingIncoming,
  } = useFriendRequests("incoming");

  const {
    data: outgoingData,
    isLoading: isLoadingOutgoing,
    refetch: refetchOutgoing,
    isRefetching: isRefetchingOutgoing,
  } = useFriendRequests("outgoing");

  // Mutations
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptFriendRequest();
  const { mutate: removeRequest, isPending: isRemoving } = useRemoveFriendRequest();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
  const { mutate: createChat, isPending: isCreatingChat } = useCreateDirectConversation();

  // Search state
  const [searchUsername, setSearchUsername] = useState("");
  const [submittedUsername, setSubmittedUsername] = useState<string | undefined>(undefined);
  const {
    data: searchUser,
    isLoading: isSearching,
    isError: isSearchError,
  } = useFindUserByUsername(submittedUsername);

  const friends = friendsData?.items ?? [];
  const incomingRequests = incomingData?.items ?? [];
  const outgoingRequests = outgoingData?.items ?? [];
  const pendingCount = incomingRequests.length;

  const handleStartChat = (userId: string) => {
    createChat(userId, {
      onSuccess: (conv) => {
        router.push(`/chat/${conv.id}`);
      },
    });
  };

  const handleSearch = () => {
    const clean = searchUsername.trim().replace(/^@/, "");
    if (!clean) return;
    setSubmittedUsername(clean);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="border-b border-border bg-surface px-5 py-3.5">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <BackButton />
            <Text className="text-xl font-bold text-foreground">
              {tFriends("title")}
            </Text>
          </View>
        </View>

        {/* Tab Controls */}
        <View className="flex-row rounded-xl bg-muted/60 p-1">
          <TouchableOpacity
            onPress={() => setActiveTab("friends")}
            className={`flex-1 py-2 rounded-lg items-center justify-center ${
              activeTab === "friends" ? "bg-surface shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === "friends" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tFriends("title")} ({friends.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("requests")}
            className={`flex-1 py-2 rounded-lg items-center justify-center relative ${
              activeTab === "requests" ? "bg-surface shadow-xs" : ""
            }`}
          >
            <View className="flex-row items-center gap-1">
              <Text
                className={`text-xs font-semibold ${
                  activeTab === "requests" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tFriends("openRequests")}
              </Text>
              {pendingCount > 0 && (
                <View className="h-4 min-w-[16px] px-1 rounded-full bg-primary items-center justify-center">
                  <Text className="text-[10px] font-bold text-primary-foreground">
                    {pendingCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("search")}
            className={`flex-1 py-2 rounded-lg items-center justify-center ${
              activeTab === "search" ? "bg-surface shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === "search" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tFriends("find")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        {activeTab === "friends" && (
          isLoadingFriends ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#009a9a" />
            </View>
          ) : friends.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-4xl mb-3">👥</Text>
              <Text className="text-base font-semibold text-foreground mb-1 text-center">
                {tFriends("empty")}
              </Text>
              <Button
                variant="primary"
                onPress={() => setActiveTab("search")}
                className="mt-4"
              >
                {tFriends("find")}
              </Button>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.user.id}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetchingFriends}
                  onRefresh={() => void refetchFriends()}
                  tintColor="#009a9a"
                />
              }
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between border-b border-border/50 bg-surface px-5 py-3.5">
                  <TouchableOpacity
                    className="flex-row items-center flex-1 mr-3"
                    onPress={() => router.push(`/profile/${item.user.username}`)}
                  >
                    <Avatar
                      src={item.user.avatarUrl}
                      name={item.user.displayName || item.user.username}
                      size="md"
                      className="mr-3"
                    />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {item.user.displayName || item.user.username}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        @{item.user.username}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleStartChat(item.user.id)}
                      disabled={isCreatingChat}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 active:opacity-70"
                    >
                      <Text className="text-xs font-semibold text-primary">
                        💬 {tFriends("messages")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => unfriend(item.user.username)}
                      disabled={isUnfriending}
                      className="rounded-lg bg-danger/10 px-2.5 py-1.5 active:opacity-70"
                    >
                      <Text className="text-xs font-semibold text-danger">
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )
        )}

        {activeTab === "requests" && (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={isRefetchingIncoming || isRefetchingOutgoing}
                onRefresh={() => {
                  void refetchIncoming();
                  void refetchOutgoing();
                }}
                tintColor="#009a9a"
              />
            }
          >
            {/* Incoming requests */}
            <View className="p-4 border-b border-border">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {tFriends("requests.incomingHeading")} ({incomingRequests.length})
              </Text>
              {isLoadingIncoming ? (
                <ActivityIndicator size="small" color="#009a9a" />
              ) : incomingRequests.length === 0 ? (
                <Text className="text-sm text-muted-foreground italic py-2">
                  {tFriends("requests.empty")}
                </Text>
              ) : (
                <View className="gap-3">
                  {incomingRequests.map((item) => (
                    <View
                      key={item.user.id}
                      className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-3"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <Avatar
                          src={item.user.avatarUrl}
                          name={item.user.displayName || item.user.username}
                          size="md"
                          className="mr-3"
                        />
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-foreground">
                            {item.user.displayName || item.user.username}
                          </Text>
                          <Text className="text-xs text-muted-foreground">
                            @{item.user.username}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => acceptRequest(item.user.username)}
                          disabled={isAccepting}
                          className="rounded-lg bg-primary px-3 py-1.5 active:opacity-85"
                        >
                          <Text className="text-xs font-semibold text-primary-foreground">
                            {tFriends("requests.accept")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => removeRequest(item.user.username)}
                          disabled={isRemoving}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 active:opacity-75"
                        >
                          <Text className="text-xs font-medium text-muted-foreground">
                            {tFriends("requests.decline")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Outgoing requests */}
            <View className="p-4">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {tFriends("requests.outgoingHeading")} ({outgoingRequests.length})
              </Text>
              {isLoadingOutgoing ? (
                <ActivityIndicator size="small" color="#009a9a" />
              ) : outgoingRequests.length === 0 ? (
                <Text className="text-sm text-muted-foreground italic py-2">
                  Chưa gửi lời mời nào.
                </Text>
              ) : (
                <View className="gap-3">
                  {outgoingRequests.map((item) => (
                    <View
                      key={item.user.id}
                      className="flex-row items-center justify-between rounded-xl border border-border bg-surface p-3"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <Avatar
                          src={item.user.avatarUrl}
                          name={item.user.displayName || item.user.username}
                          size="md"
                          className="mr-3"
                        />
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-foreground">
                            {item.user.displayName || item.user.username}
                          </Text>
                          <Text className="text-xs text-muted-foreground">
                            @{item.user.username}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => removeRequest(item.user.username)}
                        disabled={isRemoving}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 active:opacity-75"
                      >
                        <Text className="text-xs font-medium text-muted-foreground">
                          {tFriends("requests.cancel")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {activeTab === "search" && (
          <ScrollView className="flex-1 p-5">
            <Text className="text-base font-bold text-foreground mb-1">
              {tFriends("search.title")}
            </Text>
            <Text className="text-xs text-muted-foreground mb-4">
              {tFriends("search.hint")}
            </Text>

            <View className="flex-row gap-2 mb-6">
              <TextInput
                className="flex-1 h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground"
                placeholder={tFriends("search.usernamePlaceholder")}
                placeholderTextColor="#95a1a2"
                value={searchUsername}
                onChangeText={setSearchUsername}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                onPress={handleSearch}
                disabled={isSearching}
                className="h-12 px-5 rounded-xl bg-primary items-center justify-center active:opacity-85 shadow-xs"
              >
                {isSearching ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-sm font-semibold text-primary-foreground">
                    {tFriends("search.submit")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Result */}
            {isSearchError && (
              <View className="p-4 rounded-xl border border-danger/20 bg-danger/10 mb-4">
                <Text className="text-sm text-danger text-center">
                  {tFriends("search.notFound", { username: submittedUsername ?? "" })}
                </Text>
              </View>
            )}

            {searchUser && (
              <View className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Avatar
                    src={searchUser.avatarUrl}
                    name={searchUser.displayName || searchUser.username}
                    size="lg"
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">
                      {searchUser.displayName || searchUser.username}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      @{searchUser.username}
                    </Text>
                  </View>
                </View>

                {searchUser.username === currentUsername ? (
                  <View className="rounded-lg bg-muted p-2.5 items-center">
                    <Text className="text-xs text-muted-foreground font-medium">
                      {tFriends("request.isYou")}
                    </Text>
                  </View>
                ) : friends.some((f) => f.user.username === searchUser.username) ? (
                  <View className="flex-row gap-2">
                    <View className="flex-1 rounded-lg bg-success/15 py-2 items-center justify-center">
                      <Text className="text-xs font-semibold text-success">
                        ✓ {tFriends("request.alreadyFriends")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleStartChat(searchUser.id)}
                      className="rounded-lg bg-primary px-4 py-2 items-center justify-center active:opacity-85"
                    >
                      <Text className="text-xs font-semibold text-primary-foreground">
                        💬 {tFriends("messages")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : outgoingRequests.some((r) => r.user.username === searchUser.username) ? (
                  <View className="rounded-lg bg-warning/15 p-2.5 items-center">
                    <Text className="text-xs text-warning font-medium">
                      ⏳ {tFriends("request.waitingReply")}
                    </Text>
                  </View>
                ) : incomingRequests.some((r) => r.user.username === searchUser.username) ? (
                  <TouchableOpacity
                    onPress={() => acceptRequest(searchUser.username)}
                    disabled={isAccepting}
                    className="h-11 rounded-lg bg-primary items-center justify-center active:opacity-85"
                  >
                    <Text className="text-sm font-semibold text-primary-foreground">
                      {tFriends("requests.accept")}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => sendRequest(searchUser.username)}
                    disabled={isSending}
                    className="h-11 rounded-lg bg-primary items-center justify-center active:opacity-85"
                  >
                    {isSending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text className="text-sm font-semibold text-primary-foreground">
                        + {tFriends("request.send")}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
