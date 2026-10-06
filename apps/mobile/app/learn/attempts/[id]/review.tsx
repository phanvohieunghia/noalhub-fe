import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useQaAttemptReview, type QaAnswerReview } from "@noalhub/api/qa";
import { Badge, Spinner } from "@noalhub/ui-native";
import { LearnHeader } from "../../../../components/learn/screen-header";
import { NativePostContent } from "../../../../components/post-content";

/**
 * Looking back at an attempt already taken. Only answered questions appear —
 * the backend never returns the key for one left untouched.
 */
export default function LearnReviewScreen() {
  const t = useTranslations("web.learn");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const review = useQaAttemptReview(id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Back goes to the list: popping would reopen a finished attempt. */}
      <LearnHeader title={t("review.title")} onBack={() => router.replace("/learn")} />

      {review.isPending ? (
        <Spinner size="large" className="flex-1" />
      ) : (
        <FlatList
          data={review.data ?? []}
          keyExtractor={(row) => row.itemId}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListEmptyComponent={
            <Text className="py-10 text-center text-sm text-muted-foreground">
              {t("review.empty")}
            </Text>
          }
          renderItem={({ item }) => <ReviewCard row={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ReviewCard({ row }: { row: QaAnswerReview }) {
  const t = useTranslations("web.learn");

  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row flex-wrap gap-2">
        <Badge variant={row.isCorrect ? "success" : "danger"}>
          {row.isCorrect ? t("review.correct") : t("review.wrong")}
        </Badge>
        <Badge>{t(`kinds.${row.kind}`)}</Badge>
        {/* Self-assessed means something different from machine-checked. */}
        {row.grading === "self" ? (
          <Badge variant="primary">{t("review.selfGraded")}</Badge>
        ) : null}
      </View>

      <NativePostContent doc={row.question} />

      {row.options ? (
        <View className="gap-1">
          {row.options.map((option) => {
            const chosen =
              "optionIds" in row.response && row.response.optionIds.includes(option.id);
            return (
              <View
                key={option.id}
                className={`rounded-md px-2 py-1 ${chosen ? "bg-muted" : "opacity-70"}`}
              >
                <Text className={`text-sm text-foreground ${chosen ? "font-medium" : ""}`}>
                  {option.text}
                  {chosen ? ` · ${t("review.yourPick")}` : ""}
                </Text>
              </View>
            );
          })}
        </View>
      ) : "text" in row.response ? (
        <Text className="text-sm text-foreground">
          {t("review.youWrote", { text: row.response.text })}
        </Text>
      ) : null}

      {row.answer ? (
        <View className="gap-1 border-t border-border pt-3">
          <Text className="text-sm font-semibold text-foreground">{t("attempt.answer")}</Text>
          <NativePostContent doc={row.answer} />
        </View>
      ) : null}

      {row.explanation ? (
        <View className="gap-1 border-t border-border pt-3">
          <Text className="text-sm font-semibold text-foreground">
            {t("attempt.explanation")}
          </Text>
          <NativePostContent doc={row.explanation} />
        </View>
      ) : null}
    </View>
  );
}
