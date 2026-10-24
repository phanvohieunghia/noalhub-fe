"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  useUpdateQaItem,
  type PatchItemInput,
  type QaDifficulty,
  type QaItemFull,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Dialog } from "@noalhub/ui/dialog";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { QaItemTagPicker } from "./qa-item-tag-picker";
import { docToText, textToDoc } from "./qa-plain-doc";

const DIFFICULTIES = ["easy", "medium", "hard"] as const satisfies readonly QaDifficulty[];

/**
 * Edit one question in a modal: difficulty, the question, its options (tick the
 * correct ones) or accepted answers, and the explanation. The shape is fixed — it
 * belongs to the set, so it is shown but cannot change here.
 *
 * Question and explanation are plain text. A document that holds more than
 * paragraphs (a table, a list, bold) is left alone and not sent, so saving can
 * never flatten it.
 */
export function QaItemEditDialog({
  item,
  shapeLabel,
  sectionTitle,
  onClose,
}: {
  item: QaItemFull;
  shapeLabel: string;
  sectionTitle: string;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const update = useUpdateQaItem(item.setId);

  const initialQuestion = docToText(item.question);
  const initialExplanation = docToText(item.explanation);
  const initialAnswer = docToText(item.answer);
  const isChoice = item.options !== null;
  const isSelfGraded = !isChoice && item.answerKey === null;

  const [difficulty, setDifficulty] = useState<QaDifficulty | "">(item.difficulty ?? "");
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [options, setOptions] = useState(item.options ?? []);
  const [correct, setCorrect] = useState<string[]>(
    item.answerKey && "optionIds" in item.answerKey ? item.answerKey.optionIds : [],
  );
  const [accepted, setAccepted] = useState(
    item.answerKey && "accepted" in item.answerKey ? item.answerKey.accepted.join("\n") : "",
  );
  const [answer, setAnswer] = useState(initialAnswer ?? "");
  const [explanation, setExplanation] = useState(initialExplanation ?? "");
  const [tagIds, setTagIds] = useState<string[]>(item.tagIds);
  const [error, setError] = useState<Message | string | null>(null);

  const save = async () => {
    const cleaned = options.map((option) => ({ ...option, text: option.text.trim() }));
    const answers = accepted
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (initialQuestion !== null && question.trim() === "") return setError(t("form.needQuestion"));
    if (isChoice) {
      if (cleaned.some((option) => option.text === "")) return setError(t("sets.optionEmpty"));
      if (!cleaned.some((option) => correct.includes(option.id))) {
        return setError(t("sets.needCorrect"));
      }
    } else if (!isSelfGraded && answers.length === 0) {
      return setError(t("sets.needAccepted"));
    }

    const input: PatchItemInput = {
      difficulty: difficulty === "" ? null : difficulty,
      tagIds,
      ...(initialQuestion !== null ? { question: textToDoc(question) } : {}),
      ...(initialExplanation !== null
        ? { explanation: explanation.trim() === "" ? null : textToDoc(explanation) }
        : {}),
      ...(isChoice
        ? {
            options: cleaned,
            answerKey: { optionIds: cleaned.map((o) => o.id).filter((id) => correct.includes(id)) },
          }
        : isSelfGraded
          ? initialAnswer !== null
            ? { answer: answer.trim() === "" ? null : textToDoc(answer) }
            : {}
          : { answerKey: { accepted: answers } }),
    };

    setError(null);
    try {
      await update.mutateAsync({ id: item.id, input });
      onClose();
    } catch (caught) {
      setError(applyApiError(caught, () => undefined, []));
    }
  };

  return (
    <Dialog
      open
      size="lg"
      title={t("ws.final.editTitle", { section: sectionTitle })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Badge size="sm" className="self-start">
            {shapeLabel}
          </Badge>
          <Select
            label={t("ws.final.difficulty")}
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as QaDifficulty | "")}
            placeholder={t("sets.noDifficulty")}
            options={DIFFICULTIES.map((value) => ({
              value,
              label: t(`items.difficulty.${value}`),
            }))}
          />
        </div>

        <QaItemTagPicker value={tagIds} onChange={setTagIds} />

        {initialQuestion === null ? (
          <Typography variant="body-4" className="text-muted-foreground">
            {t("form.richNote")}
          </Typography>
        ) : (
          <Textarea
            label={t("ws.final.question")}
            rows={2}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        )}

        {isChoice ? (
          <fieldset className="flex flex-col gap-2">
            <Typography variant="caption" as="legend" className="uppercase text-muted-foreground">
              {t("ws.final.options")}
            </Typography>
            {options.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              return (
                <div key={option.id} className="flex items-center gap-3">
                  <Checkbox
                    aria-label={t("sets.markCorrect", { letter })}
                    checked={correct.includes(option.id)}
                    onCheckedChange={(checked) =>
                      setCorrect((current) =>
                        checked === true
                          ? [...current, option.id]
                          : current.filter((id) => id !== option.id),
                      )
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      label={t("sets.optionLabel", { letter })}
                      hideLabel
                      value={option.text}
                      onChange={(event) =>
                        setOptions((current) =>
                          current.map((entry) =>
                            entry.id === option.id ? { ...entry, text: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </fieldset>
        ) : isSelfGraded ? (
          initialAnswer === null ? null : (
            <Textarea
              label={t("sets.correctAnswer")}
              rows={2}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
          )
        ) : (
          <Textarea
            label={t("ws.final.accepted")}
            rows={3}
            value={accepted}
            onChange={(event) => setAccepted(event.target.value)}
          />
        )}

        {initialExplanation === null ? null : (
          <Textarea
            label={t("ws.final.explanation")}
            rows={2}
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
          />
        )}

        {error ? <AlertError message={m(error)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button loading={update.isPending} onClick={() => void save()}>
            {t("ws.final.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
