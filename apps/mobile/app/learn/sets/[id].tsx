import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { usePlayQaSet, useStartQaAttempt } from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Alert, Badge, Button, Spinner } from "@noalhub/ui-native";
import { LearnHeader } from "../../../components/learn/screen-header";
import { NativePostContent } from "../../../components/post-content";
import { useMessage } from "../../../lib/i18n";

/**
 * The set before starting. An unpublished set answers 404 exactly like a
 * missing one — the backend does not tell them apart, so neither does this.
 */
export default function LearnSetScreen() {
  const t = useTranslations("web.learn");
  const m = useMessage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const set = usePlayQaSet(id);
  const start = useStartQaAttempt();

  const begin = () => {
    start.mutate(id, {
      // `replace`: back from the attempt should land on the list, not here.
      onSuccess: (attempt) => router.replace(`/learn/attempts/${attempt.id}`),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <LearnHeader title={set.data?.title ?? t("set.title")} />

      {set.isPending ? (
        <Spinner size="large" className="flex-1" />
      ) : set.isError || !set.data ? (
        <View className="flex-1 items-center justify-center gap-1 p-8">
          <Text className="text-center text-base font-semibold text-foreground">
            {t("set.notFound")}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {t("set.notFoundBody")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">{set.data.title}</Text>
            {set.data.description ? (
              <Text className="text-sm text-muted-foreground">{set.data.description}</Text>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Badge>{t("browse.itemCount", { count: set.data.itemCount })}</Badge>
            <Badge variant="primary">{t(`shapes.${set.data.templateKey}`)}</Badge>
          </View>

          {set.data.intro ? <NativePostContent doc={set.data.intro} /> : null}

          <View className="gap-2">
            <Button loading={start.isPending} disabled={start.isPending} onPress={begin}>
              {t("set.start")}
            </Button>
            {/* Starting twice is safe — the backend hands back the open attempt. */}
            <Text className="text-xs text-muted-foreground">{t("set.resumeHint")}</Text>
          </View>

          {start.error ? (
            <Alert
              variant="danger"
              message={m(applyApiError(start.error, () => undefined, []))}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
