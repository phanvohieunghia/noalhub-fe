"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  useAddQaItem,
  useUpdateQaItem,
  type QaDifficulty,
  type QaItemFull,
  type QaItemKind,
  type PatchItemInput,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { PostContentPreview } from "./post-content-preview";
import { docToText, textToDoc } from "./qa-plain-doc";

const KINDS = ["theory", "practice", "recall", "analysis"] as const satisfies readonly QaItemKind[];
const DIFFICULTIES = ["easy", "medium", "hard"] as const satisfies readonly QaDifficulty[];
const MIN_OPTIONS = 2;

type OptionDraft = { id: string; text: string };

const newOption = (): OptionDraft => ({ id: crypto.randomUUID(), text: "" });

/**
 * Create or edit ONE question, as a form rather than a dialog: a question with
 * four options and an explanation does not fit in a modal.
 *
 * Pass `item` to edit; leave it out to create into `setId`. The answer shape
 * (choices vs. accepted answers) is picked once, on create — switching it later
 * would change what every learner attempt already means.
 *
 * Question and explanation are edited as plain text. A document that holds more
 * than paragraphs (a table, a list, bold) is shown read-only and not sent, so
 * saving can never flatten it.
 */
export function QaItemForm({ setId, item }: { setId: string; item?: QaItemFull }) {
  const t = useTranslations("admin.qa");
  const common = useTranslations("common");
  const m = useMessage();
  const router = useRouter();
  const add = useAddQaItem(setId);
  const update = useUpdateQaItem(setId);

  const editing = item !== undefined;
  const initialQuestion = docToText(item?.question ?? null);
  const initialExplanation = docToText(item?.explanation ?? null);
  const initialCorrect =
    item?.answerKey && "optionIds" in item.answerKey ? item.answerKey.optionIds : [];
  const initialAccepted =
    item?.answerKey && "accepted" in item.answerKey ? item.answerKey.accepted : [];

  const [shape, setShape] = useState<"choice" | "short">(
    editing && item.options === null ? "short" : "choice",
  );
  const [kind, setKind] = useState<QaItemKind>(item?.kind ?? "theory");
  const [difficulty, setDifficulty] = useState<QaDifficulty | "">(item?.difficulty ?? "");
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    item?.options?.length ? item.options : [newOption(), newOption()],
  );
  const [correct, setCorrect] = useState<string[]>(initialCorrect);
  const [accepted, setAccepted] = useState(initialAccepted.join("\n"));
  const [explanation, setExplanation] = useState(initialExplanation ?? "");
  const [error, setError] = useState<Message | string | null>(null);

  const pending = add.isPending || update.isPending;

  const submit = async () => {
    const answers = accepted
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const cleaned = options.map((option) => ({ ...option, text: option.text.trim() }));

    if (initialQuestion !== null && question.trim() === "") return setError(t("form.needQuestion"));
    if (shape === "choice") {
      if (cleaned.some((option) => option.text === "")) return setError(t("sets.optionEmpty"));
      if (!cleaned.some((option) => correct.includes(option.id))) {
        return setError(t("sets.needCorrect"));
      }
    } else if (answers.length === 0) {
      return setError(t("sets.needAccepted"));
    }

    const input: PatchItemInput = {
      kind,
      difficulty: difficulty === "" ? null : difficulty,
      ...(initialQuestion !== null ? { question: textToDoc(question) } : {}),
      ...(initialExplanation !== null
        ? { explanation: explanation.trim() === "" ? null : textToDoc(explanation) }
        : {}),
      ...(shape === "choice"
        ? {
            options: cleaned,
            answerKey: { optionIds: cleaned.map((o) => o.id).filter((id) => correct.includes(id)) },
          }
        : { options: null, answerKey: { accepted: answers } }),
    };

    setError(null);
    try {
      if (editing) {
        await update.mutateAsync({ id: item.id, input });
      } else {
        // `question` is required on create even when the form has nothing to
        // read it from, so the spread above can only be skipped for edits.
        await add.mutateAsync({ ...input, kind, question: textToDoc(question) });
      }
      router.push(`/qa/sets/${setId}`);
    } catch (caught) {
      setError(applyApiError(caught, () => undefined, []));
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {!editing ? (
          <Select
            label={t("form.answerType")}
            value={shape}
            onChange={(event) => setShape(event.target.value as "choice" | "short")}
            options={[
              { value: "choice", label: t("form.shapeChoice") },
              { value: "short", label: t("form.shapeShort") },
            ]}
          />
        ) : null}
        <Select
          label={t("form.kind")}
          value={kind}
          onChange={(event) => setKind(event.target.value as QaItemKind)}
          options={KINDS.map((value) => ({ value, label: t(`items.kinds.${value}`) }))}
        />
        <Select
          label={t("sets.difficultyLabel")}
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as QaDifficulty | "")}
          placeholder={t("sets.noDifficulty")}
          options={DIFFICULTIES.map((value) => ({
            value,
            label: t(`items.difficulty.${value}`),
          }))}
        />
      </div>

      {initialQuestion === null && item ? (
        <RichTextNotice label={t("form.question")} doc={item.question} note={t("form.richNote")} />
      ) : (
        <Textarea
          label={t("form.question")}
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
      )}

      {shape === "choice" ? (
        <fieldset className="flex flex-col gap-2">
          <Typography variant="title-4" as="legend">
            {t("sets.optionsLabel")}
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("form.removeOption", { letter })}
                  disabled={options.length <= MIN_OPTIONS}
                  onClick={() => {
                    setOptions((current) => current.filter((entry) => entry.id !== option.id));
                    setCorrect((current) => current.filter((id) => id !== option.id));
                  }}
                >
                  <Icon icon={ICONS.close} />
                </Button>
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-3">
            <Typography variant="body-4" className="text-muted-foreground">
              {t("sets.optionsHint")}
            </Typography>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOptions((current) => [...current, newOption()])}
            >
              <Icon icon={ICONS.add} />
              {t("form.addOption")}
            </Button>
          </div>
        </fieldset>
      ) : (
        <Textarea
          label={t("sets.acceptedLabel")}
          hint={t("sets.acceptedHint")}
          rows={4}
          value={accepted}
          onChange={(event) => setAccepted(event.target.value)}
        />
      )}

      {initialExplanation === null && item?.explanation ? (
        <RichTextNotice
          label={t("sets.explanation")}
          doc={item.explanation}
          note={t("form.richNote")}
        />
      ) : (
        <Textarea
          label={t("sets.explanation")}
          rows={3}
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
        />
      )}

      {error ? <AlertError message={m(error)} /> : null}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          {common("actions.cancel")}
        </Button>
        <Button disabled={pending} onClick={() => void submit()}>
          {editing ? common("actions.save") : common("actions.create")}
        </Button>
      </div>
    </div>
  );
}

function RichTextNotice({
  label,
  doc,
  note,
}: {
  label: string;
  doc: NonNullable<QaItemFull["question"]>;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Typography variant="title-4">{label}</Typography>
      <div className="rounded-md border border-border bg-muted px-3 py-2">
        <PostContentPreview doc={doc} />
      </div>
      <Typography variant="body-4" className="text-muted-foreground">
        {note}
      </Typography>
    </div>
  );
}
