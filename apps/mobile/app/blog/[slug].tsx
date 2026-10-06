import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { usePublishedPost } from "@noalhub/api/blog";
import { Avatar, Badge, Button } from "@noalhub/ui-native";
import { NativePostContent } from "../../components/post-content";
import { useDateFormat } from "../../lib/i18n";
import { BackButton } from "../../components/back-button";

export default function BlogPostDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const tBlog = useTranslations("web.blog");
  const { formatDate } = useDateFormat();

  const { data: post, isLoading, isError, refetch } = usePublishedPost(slug);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 py-3.5">
        <View className="flex-row items-center gap-2.5 flex-1 mr-3">
          <BackButton />
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {post?.title || tBlog("post.fallbackTitle")}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#009a9a" />
        </View>
      ) : isError || !post ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-4xl mb-3">⚠️</Text>
          <Text className="text-base font-semibold text-foreground mb-1 text-center">
            {tBlog("notFound.title")}
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            {tBlog("notFound.message")}
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            {tBlog("notFound.backToList")}
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
          {/* Category & Reading Time */}
          <View className="flex-row items-center gap-2 mb-3">
            {post.category && (
              <Badge variant="primary">
                {post.category.name}
              </Badge>
            )}
            {post.contentText ? (
              <Text className="text-xs text-muted-foreground">
                • {tBlog("post.readingTime", {
                  minutes: Math.max(1, Math.ceil(post.contentText.split(/\s+/).length / 200)),
                })}
              </Text>
            ) : null}
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </Text>

          {/* Author */}
          <View className="flex-row items-center mb-6 pb-4 border-b border-border">
            <Avatar
              src={post.author.avatarUrl}
              name={post.author.displayName}
              size="sm"
              className="mr-3"
            />
            <View>
              <Text className="text-sm font-semibold text-foreground">
                {post.author.displayName}
              </Text>
              {post.publishedAt && (
                <Text className="text-xs text-muted-foreground">
                  {formatDate(post.publishedAt)}
                </Text>
              )}
            </View>
          </View>

          {/* Cover Image */}
          {post.coverImageUrl && (
            <Image
              source={{ uri: post.coverImageUrl }}
              className="h-52 w-full rounded-2xl bg-muted mb-6"
              resizeMode="cover"
            />
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <Text className="text-base font-medium text-foreground/80 italic mb-6 leading-relaxed">
              {post.excerpt}
            </Text>
          )}

          {/* Body Content */}
          <NativePostContent doc={post.content} />

          {/* Tags */}
          {post.tags.length > 0 && (
            <View className="mt-8 pt-4 border-t border-border">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {tBlog("post.tagsHeading")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <View
                    key={tag.slug}
                    className="rounded-full bg-muted/60 px-3 py-1"
                  >
                    <Text className="text-xs text-muted-foreground">
                      #{tag.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
