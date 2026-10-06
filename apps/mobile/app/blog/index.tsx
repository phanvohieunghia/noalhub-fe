import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useBlogCategories, usePublishedPosts } from "@noalhub/api/blog";
import { Badge } from "@noalhub/ui-native";
import { BackButton } from "../../components/back-button";

export default function BlogListScreen() {
  const router = useRouter();
  const tBlog = useTranslations("web.blog");

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: categoriesData } = useBlogCategories();
  const {
    data: postsData,
    isLoading,
    refetch,
    isRefetching,
  } = usePublishedPosts(selectedCategory ? { category: selectedCategory } : {});

  const categories = categoriesData ?? [];
  const posts = postsData?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="border-b border-border bg-surface px-5 py-3.5">
        <View className="flex-row items-center gap-2.5 mb-2">
          <BackButton />
          <Text className="text-xl font-bold text-foreground">
            {tBlog("list.title")}
          </Text>
        </View>

        {/* Categories Horizontal Scroll */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(undefined)}
              className={`px-3 py-1.5 rounded-full border ${
                selectedCategory === undefined
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === undefined ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Tất cả
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-full border ${
                  selectedCategory === cat.slug
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === cat.slug ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Posts List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#009a9a" />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-4xl mb-3">📰</Text>
          <Text className="text-base font-semibold text-foreground mb-1 text-center">
            {tBlog("list.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor="#009a9a"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/blog/${item.slug}`)}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs active:opacity-90"
            >
              {item.coverImageUrl && (
                <Image
                  source={{ uri: item.coverImageUrl }}
                  className="h-44 w-full bg-muted"
                  resizeMode="cover"
                />
              )}

              <View className="p-4">
                {item.category && (
                  <View className="self-start mb-2">
                    <Badge variant="primary">
                      {item.category.name}
                    </Badge>
                  </View>
                )}

                <Text className="text-lg font-bold text-foreground mb-1.5 leading-snug">
                  {item.title}
                </Text>

                {item.excerpt && (
                  <Text className="text-sm text-muted-foreground mb-3 leading-relaxed" numberOfLines={2}>
                    {item.excerpt}
                  </Text>
                )}

                <View className="flex-row items-center justify-between pt-2 border-t border-border/40">
                  <Text className="text-xs text-muted-foreground">
                    {item.author.displayName}
                  </Text>

                  {item.readingMinutes ? (
                    <Text className="text-xs text-accent">
                      ⏱ {tBlog("post.readingTime", { minutes: item.readingMinutes })}
                    </Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
