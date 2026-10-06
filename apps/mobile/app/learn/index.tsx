import React, { useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useBrowseQaSets, type QaItemKind, type QaSetSummary } from "@noalhub/api/qa";
import { Badge, Button, Spinner } from "@noalhub/ui-native";
import { LearnHeader } from "../../components/learn/screen-header";

const KINDS = ["theory", "practice", "recall", "analysis"] as const;

/**
 * The way into the learner surface — `GET /qa/sets/:id` needs an id, and this
 * list is the only thing that hands one out. The button reads "Continue"
 * whenever the backend reports an open attempt for the set.
 */
export default function LearnBrowseScreen() {
  const t = useTranslations("web.learn");
  const router = useRouter();
  const [kind, setKind] = useState<QaItemKind | "">("");
  const sets = useBrowseQaSets();

  const rows = (sets.data?.items ?? []).filter(
    (row) => kind === "" || row.itemKinds.includes(kind),
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <LearnHeader title={t("browse.title")} />

      <View className="border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
        >
          {(["", ...KINDS] as const).map((value) => (
            <TouchableOpacity
              key={value || "all"}
              onPress={() => setKind(value)}
              className={`rounded-full border px-3.5 py-1.5 ${
                kind === value ? "border-primary bg-primary" : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  kind === value ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {value === "" ? t("browse.allKinds") : t(`kinds.${value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {sets.isPending ? (
        <Spinner size="large" className="flex-1" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(set) => set.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          refreshing={sets.isRefetching}
          onRefresh={() => void sets.refetch()}
          ListHeaderComponent={
            <Text className="text-sm text-muted-foreground">{t("browse.intro")}</Text>
          }
          ListEmptyComponent={
            <Text className="py-10 text-center text-sm text-muted-foreground">
              {/* Empty means nothing is PUBLISHED yet — say that, not "no data". */}
              {sets.data?.total === 0 ? t("browse.emptyNone") : t("browse.emptyFilter")}
            </Text>
          }
          renderItem={({ item }) => (
            <SetCard set={item} onOpen={() => router.push(`/learn/sets/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SetCard({ set, onOpen }: { set: QaSetSummary; onOpen: () => void }) {
  const t = useTranslations("web.learn");

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.8}
      className="gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground">{set.title}</Text>
        {set.description ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {set.description}
          </Text>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Badge>{t("browse.itemCount", { count: set.itemCount })}</Badge>
        <Badge variant="primary">{t(`shapes.${set.templateKey}`)}</Badge>
        {set.difficulty ? <Badge>{t(`difficulty.${set.difficulty}`)}</Badge> : null}
        {set.itemKinds.map((value) => (
          <Badge key={value}>{t(`kinds.${value}`)}</Badge>
        ))}
      </View>

      <Button size="sm" className="self-start" onPress={onOpen}>
        {set.openAttemptId ? t("browse.continue") : t("browse.start")}
      </Button>
    </TouchableOpacity>
  );
}
