import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { QA_COUNT_OPTIONS, usePlayQaDataset, useStartQaAttempt } from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Alert, Badge, Button, Spinner } from "@noalhub/ui-native";
import { LearnHeader } from "../../../components/learn/screen-header";
import { useMessage } from "../../../lib/i18n";

/**
 * The dataset before starting. One with no published question answers 404
 * exactly like a missing one — the backend does not tell them apart, so neither does this.
 */
export default function LearnDatasetScreen() {
  const t = useTranslations("web.learn");
  const m = useMessage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dataset = usePlayQaDataset(id);
  const start = useStartQaAttempt();

  // `null` = all of them.
  const [count, setCount] = useState<number | null>(10);

  const begin = () => {
    start.mutate(
      { datasetId: id, count: count ?? undefined },
      {
        // `replace`: back from the attempt should land on the list, not here.
        onSuccess: (attempt) => router.replace(`/learn/attempts/${attempt.id}`),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <LearnHeader title={dataset.data?.title ?? t("dataset.title")} />

      {dataset.isPending ? (
        <Spinner size="large" className="flex-1" />
      ) : dataset.isError || !dataset.data ? (
        <View className="flex-1 items-center justify-center gap-1 p-8">
          <Text className="text-center text-base font-semibold text-foreground">
            {t("dataset.notFound")}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {t("dataset.notFoundBody")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">{dataset.data.title}</Text>
            {dataset.data.description ? (
              <Text className="text-sm text-muted-foreground">{dataset.data.description}</Text>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Badge>{t("browse.itemCount", { count: dataset.data.itemCount })}</Badge>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">{t("browse.countLabel")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {[...QA_COUNT_OPTIONS, null].map((value) => {
                const active = count === value;
                return (
                  <TouchableOpacity
                    key={value ?? "all"}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setCount(value)}
                    className={`rounded-full border px-3.5 py-1.5 ${
                      active ? "border-primary bg-primary" : "border-border bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {value === null
                        ? t("browse.countAll", {
                            count: dataset.data.itemCount,
                          })
                        : t("browse.countOption", { count: value })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Button loading={start.isPending} disabled={start.isPending} onPress={begin}>
              {t("dataset.start")}
            </Button>
            {/* Starting twice is safe — the backend hands back the open attempt. */}
            <Text className="text-xs text-muted-foreground">{t("dataset.resumeHint")}</Text>
          </View>

          {start.error ? (
            <Alert variant="danger" message={m(applyApiError(start.error, () => undefined, []))} />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
