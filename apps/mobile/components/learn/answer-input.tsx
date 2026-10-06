import React, { useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslations } from "use-intl";

import type {
  QaAnswerResult,
  QaItemPlay,
  QaResponse,
  QaTemplateKey,
} from "@noalhub/api/qa";
import { Button, Input } from "@noalhub/ui-native";

const LETTERS = "ABCDEFGH";

/**
 * One question, laid out to fill the screen: the question on top, the answers
 * taking the rest, and the action pinned to the bottom edge where the thumb is.
 *
 * The input is picked by the SET's shape (`templateKey`), never by whether the
 * item happens to have options — a flashcard has none either, yet needs
 * "I knew it / I didn't", not a text box.
 *
 * After the verdict it stays mounted and locked, so the learner sees their own
 * pick coloured by the result; the bottom bar then shows `afterAnswer` instead.
 * Mount it with `key={item.id}` so picks don't leak into the next question.
 */
export function AnswerInput({
  templateKey,
  item,
  question,
  result,
  disabled,
  afterAnswer,
  onSubmit,
}: {
  templateKey: QaTemplateKey;
  item: QaItemPlay;
  /** The question block, rendered above the answers in the same scroll area. */
  question: React.ReactNode;
  result: QaAnswerResult | null;
  disabled?: boolean;
  afterAnswer: React.ReactNode;
  onSubmit: (response: QaResponse, durationMs: number) => void;
}) {
  const t = useTranslations("web.learn");
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const shownAt = useRef(Date.now());

  const locked = result !== null || disabled === true;
  const flashcard = templateKey === "flashcard";
  const options = flashcard ? [] : (item.options ?? []);
  const single = templateKey === "true_false";

  const send = (response: QaResponse) =>
    onSubmit(response, Math.max(0, Date.now() - shownAt.current));

  const toggle = (id: string) =>
    setPicked((current) => {
      if (single) return [id];
      return current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
    });

  const submitText = () => {
    if (!locked && text.trim() !== "") send({ text });
  };

  let body: React.ReactNode;
  let action: React.ReactNode;

  if (flashcard) {
    body = result ? null : (
      <View className="gap-2">
        <Text className="text-sm text-muted-foreground">{t("answer.selfPrompt")}</Text>
        <Text className="text-xs text-muted-foreground">{t("answer.selfNote")}</Text>
      </View>
    );
    action = (
      <View className="flex-row gap-3">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          disabled={locked}
          onPress={() => send({ known: false })}
        >
          {t("answer.unknown")}
        </Button>
        <Button size="lg" className="flex-1" disabled={locked} onPress={() => send({ known: true })}>
          {t("answer.known")}
        </Button>
      </View>
    );
  } else if (options.length > 0) {
    body = (
      <View className="gap-3">
        <Text className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {single ? t("answer.singleHint") : t("answer.multiHint")}
        </Text>
        {options.map((option, index) => (
          <OptionCard
            key={option.id}
            letter={LETTERS[index] ?? String(index + 1)}
            text={option.text}
            single={single}
            state={optionState({
              chosen: picked.includes(option.id),
              result,
              pickCount: picked.length,
            })}
            disabled={locked}
            onPress={() => toggle(option.id)}
          />
        ))}
      </View>
    );
    action = (
      <Button
        size="lg"
        disabled={locked || picked.length === 0}
        loading={disabled}
        onPress={() => send({ optionIds: picked })}
      >
        {t("answer.submit")}
      </Button>
    );
  } else {
    body = (
      <Input
        label={t("answer.text")}
        value={text}
        helperText={t("answer.textHint")}
        editable={!locked}
        autoFocus
        returnKeyType="send"
        onChangeText={setText}
        onSubmitEditing={submitText}
      />
    );
    action = (
      <Button
        size="lg"
        disabled={locked || text.trim() === ""}
        loading={disabled}
        onPress={submitText}
      >
        {t("answer.submit")}
      </Button>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* The question takes whatever the answers leave, centred in it. */}
        <View className="min-h-40 flex-1 justify-center">{question}</View>
        {body}
      </ScrollView>

      <View className="border-t border-border bg-surface px-5 pb-2 pt-3">
        {result ? afterAnswer : action}
      </View>
    </View>
  );
}

type OptionState = "idle" | "picked" | "right" | "wrong" | "chosen" | "dimmed";

/**
 * The result carries no answer key, so only the learner's own picks can be
 * coloured: green when right, red only for a single wrong pick — with several
 * picks and a wrong verdict, which one was wrong is unknown here.
 */
function optionState({
  chosen,
  result,
  pickCount,
}: {
  chosen: boolean;
  result: QaAnswerResult | null;
  pickCount: number;
}): OptionState {
  if (!result) return chosen ? "picked" : "idle";
  if (!chosen) return "dimmed";
  if (result.isCorrect) return "right";
  return pickCount === 1 ? "wrong" : "chosen";
}

const CARD_STATES: Record<OptionState, { card: string; letter: string; letterText: string }> = {
  idle: {
    card: "border-border bg-surface",
    letter: "border-border",
    letterText: "text-muted-foreground",
  },
  picked: {
    card: "border-primary bg-primary/10",
    letter: "border-primary bg-primary",
    letterText: "text-primary-foreground",
  },
  right: {
    card: "border-success bg-success/10",
    letter: "border-success bg-success",
    letterText: "text-background",
  },
  wrong: {
    card: "border-danger bg-danger/10",
    letter: "border-danger bg-danger",
    letterText: "text-background",
  },
  chosen: {
    card: "border-foreground/40 bg-muted",
    letter: "border-foreground/40",
    letterText: "text-foreground",
  },
  dimmed: {
    card: "border-border opacity-50",
    letter: "border-border",
    letterText: "text-muted-foreground",
  },
};

function OptionCard({
  letter,
  text,
  single,
  state,
  disabled,
  onPress,
}: {
  letter: string;
  text: string;
  single: boolean;
  state: OptionState;
  disabled: boolean;
  onPress: () => void;
}) {
  const look = CARD_STATES[state];
  const checked = state !== "idle" && state !== "dimmed";

  return (
    <TouchableOpacity
      accessibilityRole={single ? "radio" : "checkbox"}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.75}
      className={`min-h-16 flex-row items-center gap-4 rounded-2xl border-2 px-4 py-3.5 ${look.card}`}
    >
      <View className={`h-9 w-9 items-center justify-center rounded-lg border-2 ${look.letter}`}>
        <Text className={`text-sm font-bold ${look.letterText}`}>{letter}</Text>
      </View>
      <Text className="flex-1 text-lg text-foreground">{text}</Text>
      {state === "right" ? (
        <Text className="text-xl font-bold text-success">✓</Text>
      ) : state === "wrong" ? (
        <Text className="text-xl font-bold text-danger">✕</Text>
      ) : null}
    </TouchableOpacity>
  );
}
