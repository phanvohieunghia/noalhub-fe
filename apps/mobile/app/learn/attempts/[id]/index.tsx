import React, { useCallback, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import type { Message } from "@noalhub/api/message";
import {
  useFinishQaAttempt,
  usePlayQaSet,
  useQaAttempts,
  useQaAttemptReview,
  useSubmitQaAnswer,
  type QaAnswerResult,
  type QaAttempt,
  type QaItemPlay,
  type QaResponse,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Alert, Badge, Button, Spinner } from "@noalhub/ui-native";
import { AnswerInput } from "../../../../components/learn/answer-input";
import { ExplanationSheet } from "../../../../components/learn/explanation-sheet";
import { LearnHeader } from "../../../../components/learn/screen-header";
import { NativePostContent } from "../../../../components/post-content";
import { useMessage } from "../../../../lib/i18n";

/**
 * Taking a set, one question at a time — same flow as the web `LearnAttempt`,
 * laid out for a phone: the question and its answers fill the screen, and the
 * verdict + explanation pop up as a sheet that closes itself after 3s. The
 * answered question stays behind it, coloured, with "Next" and a way to reopen
 * the explanation — 3s is rarely enough to read one through.
 *
 * The question on screen is **pinned** while its result shows: submitting
 * refetches the review, which drops the answered question from `remaining`, and
 * reading `remaining[0]` then would swap it out from under its explanation.
 */
export default function LearnAttemptScreen() {
  const t = useTranslations("web.learn");
  const m = useMessage();
  const router = useRouter();
  const { id: attemptId } = useLocalSearchParams<{ id: string }>();

  const attempts = useQaAttempts();
  const listed = attempts.data?.find((row) => row.id === attemptId);
  const set = usePlayQaSet(listed?.setId);
  const answered = useQaAttemptReview(attemptId);
  const submit = useSubmitQaAnswer(attemptId);
  const finish = useFinishQaAttempt();

  const [shown, setShown] = useState<{ item: QaItemPlay; result: QaAnswerResult } | null>(
    null,
  );
  // Every answer returns the updated attempt — fresher than the list query.
  const [latest, setLatest] = useState<QaAttempt | null>(null);
  const [error, setError] = useState<Message | string | null>(null);
  // `auto` right after answering (closes itself), `manual` when reopened.
  const [sheet, setSheet] = useState<"auto" | "manual" | null>(null);
  // Stable, or the sheet's timer restarts on every render.
  const closeSheet = useCallback(() => setSheet(null), []);
  // "Next" can be pressed before the review refetch lands; without this the
  // question just answered would come back, and the backend refuses duplicates.
  const [justAnswered, setJustAnswered] = useState<string[]>([]);

  const answeredIds = useMemo(
    () => new Set([...(answered.data ?? []).map((row) => row.itemId), ...justAnswered]),
    [answered.data, justAnswered],
  );
  const remaining = (set.data?.items ?? []).filter(
    (item) => !answeredIds.has(item.id) && item.id !== shown?.item.id,
  );
  const current = shown?.item ?? remaining[0];
  const attempt = latest ?? listed;

  const send = async (response: QaResponse, durationMs: number) => {
    if (!current) return;
    setError(null);
    try {
      const result = await submit.mutateAsync({ itemId: current.id, response, durationMs });
      setShown({ item: current, result });
      setSheet("auto");
      setLatest(result.attempt);
      setJustAnswered((ids) => [...ids, current.id]);
    } catch (err) {
      setError(applyApiError(err, () => undefined, []));
    }
  };

  const next = () => {
    setShown(null);
    setSheet(null);
    setError(null);
  };

  const wrapUp = async () => {
    setError(null);
    try {
      // A second finish answers 409 — nothing to close, go straight to review.
      if (attempt?.status === "in_progress") await finish.mutateAsync(attemptId);
      router.replace(`/learn/attempts/${attemptId}/review`);
    } catch (err) {
      setError(applyApiError(err, () => undefined, []));
    }
  };

  const loading = attempts.isPending || answered.isPending || (listed && set.isPending);

  if (loading || !attempt || !set.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
        <LearnHeader title={t("attempt.title")} />
        {loading ? (
          <Spinner size="large" className="flex-1" />
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-center text-base font-semibold text-foreground">
              {t("attempt.notFound")}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const total = set.data.itemCount;
  const done = attempt.status !== "in_progress" || !current;
  const position = Math.min(total, attempt.answeredCount + (shown ? 0 : 1));
  const percent = total > 0 ? Math.round((attempt.answeredCount / total) * 100) : 0;
  const selfGraded = set.data.templateKey === "flashcard";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <LearnHeader
        title={set.data.title}
        right={
          <Badge variant="success">
            {t(selfGraded ? "attempt.knownSoFar" : "attempt.correctSoFar", {
              count: attempt.correctCount,
            })}
          </Badge>
        }
      />

      <View className="flex-row items-center gap-3 px-5 py-3">
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t("attempt.progressLabel")}
          accessibilityValue={{ min: 0, max: total, now: attempt.answeredCount }}
          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </View>
        {!done ? (
          <Text className="text-xs text-muted-foreground">
            {t("attempt.questionOf", { current: position, total })}
          </Text>
        ) : null}
      </View>

      {error ? <Alert variant="danger" message={m(error)} className="mx-5 mb-2" /> : null}

      {done ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
          <Summary
            answered={attempt.answeredCount}
            correct={attempt.correctCount}
            selfGraded={selfGraded}
            pending={finish.isPending}
            onReview={() => void wrapUp()}
            onBack={() => router.replace("/learn")}
          />
        </ScrollView>
      ) : current ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <AnswerInput
            key={current.id}
            templateKey={set.data.templateKey}
            item={current}
            result={shown?.result ?? null}
            disabled={submit.isPending}
            onSubmit={(response, durationMs) => void send(response, durationMs)}
            question={
              <View className="gap-4">
                <View className="flex-row flex-wrap gap-2">
                  <Badge>{t(`kinds.${current.kind}`)}</Badge>
                  {current.difficulty ? (
                    <Badge variant="primary">{t(`difficulty.${current.difficulty}`)}</Badge>
                  ) : null}
                </View>
                <NativePostContent doc={current.question} size="lg" />
              </View>
            }
            afterAnswer={
              <View className="flex-row gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onPress={() => setSheet("manual")}
                >
                  {t("attempt.showExplanation")}
                </Button>
                <Button size="lg" className="flex-1" onPress={next}>
                  {remaining.length === 0 ? t("attempt.seeResult") : `${t("attempt.next")} →`}
                </Button>
              </View>
            }
          />
        </KeyboardAvoidingView>
      ) : null}

      {shown ? (
        <ExplanationSheet
          result={shown.result}
          visible={sheet !== null}
          autoClose={sheet === "auto"}
          onClose={closeSheet}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Summary({
  answered,
  correct,
  selfGraded,
  pending,
  onReview,
  onBack,
}: {
  answered: number;
  correct: number;
  selfGraded: boolean;
  pending: boolean;
  onReview: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("web.learn");
  const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <View className="items-center gap-4 rounded-xl border border-border bg-surface p-6">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Text className="text-2xl">🏆</Text>
      </View>
      <Text className="text-xl font-bold text-foreground">{t("attempt.summaryTitle")}</Text>
      <View className="items-center">
        <Text className="text-4xl font-semibold text-foreground">
          {correct}
          <Text className="text-muted-foreground">/{answered}</Text>
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          {t(selfGraded ? "attempt.summaryKnown" : "attempt.summaryCorrect", { rate })}
        </Text>
      </View>
      <View className="w-full gap-2">
        <Button loading={pending} disabled={pending} onPress={onReview}>
          {t("attempt.finish")}
        </Button>
        <Button variant="outline" onPress={onBack}>
          {t("attempt.backToBrowse")}
        </Button>
      </View>
    </View>
  );
}
