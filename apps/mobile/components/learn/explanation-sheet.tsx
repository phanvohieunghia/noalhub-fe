import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";

import type { QaAnswerResult } from "@noalhub/api/qa";
import { NativePostContent } from "../post-content";

export const EXPLANATION_AUTO_CLOSE_MS = 3000;

/**
 * The verdict, the answer and the explanation, as a bottom sheet over the
 * question. It pops up right after answering and closes itself after 3s — the
 * draining bar shows how long is left, and a tap closes it sooner.
 *
 * Reopened by hand (`autoClose={false}`) it stays until dismissed: the learner
 * asked to read it, so a timer would only get in the way.
 */
export function ExplanationSheet({
  result,
  visible,
  autoClose,
  onClose,
}: {
  result: QaAnswerResult;
  visible: boolean;
  autoClose: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("web.learn");
  const insets = useSafeAreaInsets();
  const remaining = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible || !autoClose) return;
    remaining.setValue(1);
    const timer = Animated.timing(remaining, {
      toValue: 0,
      duration: EXPLANATION_AUTO_CLOSE_MS,
      useNativeDriver: false,
    });
    timer.start(({ finished }) => {
      if (finished) onClose();
    });
    return () => timer.stop();
  }, [visible, autoClose, remaining, onClose]);

  const good = result.isCorrect;
  const verdict =
    result.grading === "self"
      ? t(good ? "attempt.selfKnown" : "attempt.selfUnknown")
      : t(good ? "attempt.correct" : "attempt.wrong");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-neutral-950/50" onPress={onClose}>
        <Pressable
          onPress={onClose}
          className="max-h-[80%] overflow-hidden rounded-t-3xl bg-surface"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {autoClose ? (
            <View className="h-1 bg-muted">
              <Animated.View
                className={good ? "h-full bg-success" : "h-full bg-danger"}
                style={{
                  width: remaining.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </View>
          ) : null}

          <View className="items-center pt-2">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View className="flex-row items-center gap-3">
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  good ? "bg-success" : "bg-danger"
                }`}
              >
                <Text className="text-lg font-bold text-background">{good ? "✓" : "✕"}</Text>
              </View>
              <Text
                className={`flex-1 text-xl font-bold ${good ? "text-success" : "text-danger"}`}
              >
                {verdict}
              </Text>
            </View>

            {result.answer ? (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("attempt.answer")}
                </Text>
                <NativePostContent doc={result.answer} />
              </View>
            ) : null}

            {result.explanation ? (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("attempt.explanation")}
                </Text>
                <NativePostContent doc={result.explanation} />
              </View>
            ) : null}

            {autoClose ? (
              <Text className="text-center text-xs text-muted-foreground">
                {t("attempt.autoClose", { seconds: EXPLANATION_AUTO_CLOSE_MS / 1000 })}
              </Text>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
