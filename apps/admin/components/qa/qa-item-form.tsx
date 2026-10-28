"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BlogDoc } from "@noalhub/api/blog";
import type { Message } from "@noalhub/api/message";
import {
  QA_TEMPLATE_KEYS,
  useAddQaItem,
  useQaSet,
  useUpdateQaItem,
  type QaDifficulty,
  type QaItemFull,
  type QaItemKind,
  type PatchItemInput,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError } from "@noalhub/ui/alert";
import { TiptapEditor } from "@noalhub/ui/blog/tiptap-editor";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { KIND_ICONS, SHAPE_ICONS } from "./qa-icons";
import { QaItemTagPicker } from "./qa-item-tag-picker";
import { PostContentPreview } from "./post-content-preview";
import { docToText, isEmptyDoc, textToDoc } from "./qa-plain-doc";

const EMPTY_DOC: BlogDoc = { type: "doc", content: [{ type: "paragraph" }] };

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
export function QaItemForm({
  setId,
  item,
  onDone,
  onCancel,
  sections,
  defaultSection = "",
}: {
  setId: string;
  item?: QaItemFull;
  /** On create only: the headings a new question can be filed under. Leave out to file it under none. */
  sections?: { value: string; label: string }[];
  defaultSection?: string;
  /** Called after a save instead of navigating to the set page — for a form shown in a dialog. */
  onDone?: () => void;
  /** Replaces the default "go back"; also drops the card chrome, since a dialog already has its own. */
  onCancel?: () => void;
}) {
  const t = useTranslations("admin.qa");
  const common = useTranslations("common");
  const m = useMessage();
  const router = useRouter();
  const add = useAddQaItem(setId);
  const update = useUpdateQaItem(setId);

  const editing = item !== undefined;
  const initialExplanation = docToText(item?.explanation ?? null);
  const initialCorrect =
    item?.answerKey && "optionIds" in item.answerKey ? item.answerKey.optionIds : [];
  const initialAccepted =
    item?.answerKey && "accepted" in item.answerKey ? item.answerKey.accepted : [];

  // The answer shape is the SET's: a set is one shape, and a question of another
  // shape would be refused on save, so it is shown (like Generate's picker) but not pickable.
  const set = useQaSet(setId);
  const shapeKey = set.data?.questionType ?? "multiple_choice";
  const choiceMode = ["multiple_choice", "single_choice", "true_false"].includes(shapeKey);
  const singleCorrect = shapeKey !== "multiple_choice";
  const initialBack = docToText(item?.answer ?? null);
  const [back, setBack] = useState(initialBack ?? "");
  const [kind, setKind] = useState<QaItemKind>(item?.kind ?? "theory");
  const [difficulty, setDifficulty] = useState<QaDifficulty | "">(item?.difficulty ?? "");
  // The question is a full rich document (images, lists, tables…), edited as one.
  const [question, setQuestion] = useState<BlogDoc>(item?.question ?? EMPTY_DOC);
  const [options, setOptions] = useState<OptionDraft[]>(
    item?.options?.length ? item.options : [newOption(), newOption()],
  );
  const [correct, setCorrect] = useState<string[]>(initialCorrect);
  const [accepted, setAccepted] = useState(initialAccepted.join("\n"));
  const [explanation, setExplanation] = useState(initialExplanation ?? "");
  const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);
  const [section, setSection] = useState(defaultSection);
  const [error, setError] = useState<Message | string | null>(null);

  const pending = add.isPending || update.isPending;

  // True / false carries its two options itself; the author only says which is right.
  const fixedOptions: OptionDraft[] = [
    { id: "true", text: t("form.trueLabel") },
    { id: "false", text: t("form.falseLabel") },
  ];
  const shownOptions = shapeKey === "true_false" ? fixedOptions : options;

  const submit = async () => {
    const answers = accepted
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const cleaned = shownOptions.map((option) => ({ ...option, text: option.text.trim() }));

    if (isEmptyDoc(question)) return setError(t("form.needQuestion"));
    if (choiceMode) {
      if (cleaned.some((option) => option.text === "")) return setError(t("sets.optionEmpty"));
      if (!cleaned.some((option) => correct.includes(option.id))) {
        return setError(t("sets.needCorrect"));
      }
    } else if (shapeKey === "flashcard") {
      if (back.trim() === "") return setError(t("form.needBack"));
    } else if (answers.length === 0) {
      return setError(t("sets.needAccepted"));
    }

    const input: PatchItemInput = {
      kind,
      difficulty: difficulty === "" ? null : difficulty,
      tagIds,
      question,
      ...(initialExplanation !== null
        ? { explanation: explanation.trim() === "" ? null : textToDoc(explanation) }
        : {}),
      ...(choiceMode
        ? {
            options: cleaned,
            answerKey: { optionIds: cleaned.map((o) => o.id).filter((id) => correct.includes(id)) },
          }
        : shapeKey === "flashcard"
          ? { options: null, answerKey: null, answer: textToDoc(back) }
          : { options: null, answerKey: { accepted: answers } }),
    };

    setError(null);
    try {
      if (editing) {
        await update.mutateAsync({ id: item.id, input });
      } else {
        await add.mutateAsync({
          ...input,
          kind,
          question,
          ...(sections ? { sectionAnchor: section === "" ? null : section } : {}),
        });
      }
      if (onDone) onDone();
      else router.push(`/qa/sets/${setId}`);
    } catch (caught) {
      setError(applyApiError(caught, () => undefined, []));
    }
  };

  return (
    <div
      className={`flex flex-col gap-5 ${
        onCancel ? "" : "max-w-3xl rounded-lg border border-border bg-surface p-5"
      }`}
    >
      {/* Two rows of two: the icon pickers first (what the question IS), then the
          dropdowns (where it goes and how hard it is). */}
      <div className="grid items-start gap-x-6 gap-y-5 sm:grid-cols-2">
        <IconChoice
          legend={t("form.answerType")}
          value={shapeKey}
          onChange={() => undefined}
          hint={t("form.shapeLocked")}
          options={QA_TEMPLATE_KEYS.map((key) => ({
            value: key,
            icon: SHAPE_ICONS[key],
            label: t(`templates.shapes.${key}`),
            disabled: key !== shapeKey,
          }))}
        />
        <IconChoice
          legend={t("form.kind")}
          value={kind}
          onChange={setKind}
          options={KINDS.map((value) => ({
            value,
            icon: KIND_ICONS[value],
            label: t(`items.kinds.${value}`),
          }))}
        />
        {!editing && sections ? (
          <Select
            label={t("form.sectionLabel")}
            value={section}
            onChange={(event) => setSection(event.target.value)}
            placeholder={t("form.noSection")}
            options={sections}
          />
        ) : null}
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

      <QaItemTagPicker value={tagIds} onChange={setTagIds} />

      <div className="flex flex-col gap-1.5">
        <Typography variant="body-3" weight={500}>
          {t("form.question")}
        </Typography>
        <TiptapEditor
          value={question}
          onChange={setQuestion}
          contentClassName="min-h-32 max-h-80 overflow-y-auto"
        />
      </div>

      {choiceMode ? (
        <fieldset className="flex flex-col gap-2">
          <Typography variant="title-4" as="legend">
            {t("sets.optionsLabel")}
          </Typography>
          {shownOptions.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <div key={option.id} className="flex items-center gap-3">
                <Checkbox
                  aria-label={t("sets.markCorrect", { letter })}
                  checked={correct.includes(option.id)}
                  onCheckedChange={(checked) =>
                    setCorrect((current) =>
                      checked !== true
                        ? current.filter((id) => id !== option.id)
                        : singleCorrect
                          ? [option.id]
                          : [...current, option.id],
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <Input
                    label={t("sets.optionLabel", { letter })}
                    hideLabel
                    readOnly={shapeKey === "true_false"}
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
                {shapeKey === "true_false" ? null : (
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
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-3">
            <Typography variant="body-4" className="text-muted-foreground">
              {singleCorrect ? t("form.pickOne") : t("sets.optionsHint")}
            </Typography>
            {shapeKey === "true_false" ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOptions((current) => [...current, newOption()])}
            >
              <Icon icon={ICONS.add} />
              {t("form.addOption")}
            </Button>
            )}
          </div>
        </fieldset>
      ) : shapeKey === "flashcard" ? (
        <Textarea
          label={t("form.backLabel")}
          rows={4}
          value={back}
          onChange={(event) => setBack(event.target.value)}
        />
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
        <Button variant="outline" onClick={() => (onCancel ? onCancel() : router.back())}>
          {common("actions.cancel")}
        </Button>
        <Button loading={pending} onClick={() => void submit()}>
          {editing ? common("actions.save") : common("actions.create")}
        </Button>
      </div>
    </div>
  );
}

/**
 * One pick from a few icon buttons — the same look as the shape and kind pickers of
 * the Generate dialog (a lit button for the chosen one, its name in a tooltip), but
 * single-choice here.
 */
function IconChoice<T extends string>({
  legend,
  value,
  onChange,
  options,
  hint,
}: {
  legend: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; icon: string; label: string; disabled?: boolean }[];
  hint?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <Typography variant="title-4" as="legend">
        {legend}
      </Typography>
      <div className="flex gap-2">
        {options.map((option) => {
          const on = option.value === value;
          return (
            <Tooltip key={option.value} label={option.label}>
              <Button
                type="button"
                size="icon-md"
                variant={on ? "primary" : "outline"}
                aria-label={option.label}
                aria-pressed={on}
                disabled={option.disabled}
                onClick={() => onChange(option.value)}
              >
                <Icon icon={option.icon} />
              </Button>
            </Tooltip>
          );
        })}
      </div>
      {hint ? (
        <Typography variant="body-4" className="text-muted-foreground">
          {hint}
        </Typography>
      ) : null}
    </fieldset>
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
