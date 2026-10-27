"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useMe } from "@noalhub/api/auth";
import type { Message } from "@noalhub/api/message";
import {
  MAX_RUN_ITEMS,
  QA_TEMPLATE_KEYS,
  useGenerateSets,
  useQaOutline,
  useQaOutlines,
  useQaTemplates,
  type QaItemKind,
  type QaOutlineEntry,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Tooltip } from "@noalhub/ui/tooltip";

import { useAiRunChoice } from "./ai-run-picker";
import { GenerationProgress } from "./generation-progress";
import { checkRunFit } from "./qa-run-fit";
import { Typography } from "@noalhub/ui/typography";

const SHAPE_ICONS = {
  multiple_choice: LUCIDE.listChecks,
  single_choice: LUCIDE.circleDot,
  true_false: LUCIDE.toggleLeft,
  short_answer: LUCIDE.messageSquareText,
  fill_blank: LUCIDE.textCursorInput,
  flashcard: LUCIDE.layers,
} as const;

const ITEM_KINDS = ["theory", "practice", "recall", "analysis"] as const;

const KIND_ICONS = {
  theory: LUCIDE.bookOpen,
  practice: LUCIDE.wrench,
  recall: LUCIDE.brain,
  analysis: LUCIDE.microscope,
} as const;

/**
 * The second button that spends money.
 *
 * Sections must be picked (the "all" box ticks every one, and half-ticks while only
 * some are) — the backend refuses a
 * request with neither, and that refusal is the point: "empty means everything"
 * is the most expensive default available and the easiest to hit by forgetting
 * a field.
 */
export function GenerateSetsButton({
  datasetId,
  outlineId,
  sections,
  defaultAnchor,
  label,
  iconOnly = false,
  onStarted,
}: {
  /** With it, the dialog lets the author pick which outline version to generate from. */
  datasetId?: string;
  outlineId: string;
  sections: QaOutlineEntry[];
  /** Section ticked when the dialog opens; the rest stay pickable. */
  defaultAnchor?: string;
  label?: string;
  /** Show a plus icon instead of `label`, which becomes its tooltip and aria-label. */
  iconOnly?: boolean;
  /**
   * Called once the run is accepted. The dialog closes right after and the caller
   * shows the progress in place of its content. Without it the dialog stays open
   * and watches the run itself.
   */
  onStarted?: (generationId: string) => void;
}) {
  const t = useTranslations("admin.qa");
  const me = useMe();
  const [open, setOpen] = useState(false);

  if (!me.data?.canGenerateAi) return null;

  return (
    <>
      {iconOnly && label ? (
        <Tooltip label={label}>
          <Button
            variant="outline"
            size="icon-md"
            aria-label={label}
            onClick={() => setOpen(true)}
          >
            <Icon icon={LUCIDE.sparkles} />
          </Button>
        </Tooltip>
      ) : (
        <Button onClick={() => setOpen(true)}>
          {label ?? t("generate.button")}
        </Button>
      )}
      {open ? (
        <GenerateDialog
          datasetId={datasetId}
          outlineId={outlineId}
          sections={sections}
          defaultAnchor={defaultAnchor}
          onStarted={onStarted}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function GenerateDialog({
  datasetId,
  outlineId: initialOutlineId,
  sections: initialSections,
  defaultAnchor,
  onStarted,
  onClose,
}: {
  datasetId?: string;
  outlineId: string;
  sections: QaOutlineEntry[];
  defaultAnchor?: string;
  onStarted?: (generationId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const templates = useQaTemplates("qa");
  const aiRun = useAiRunChoice();
  const generate = useGenerateSets();

  // Versions are only listed when the caller names the dataset; otherwise the dialog
  // is tied to the outline it was opened from.
  const versions = useQaOutlines(datasetId);
  const [outlineId, setOutlineId] = useState(initialOutlineId);
  const other = useQaOutline(
    outlineId === initialOutlineId ? undefined : outlineId,
  );
  const sections =
    outlineId === initialOutlineId
      ? initialSections
      : (other.data?.outline ?? []);
  const loadingSections = outlineId !== initialOutlineId && other.isPending;

  const [templateId, setTemplateId] = useState("");
  // The shapes this run may produce. Chosen here rather than on the prompt: the same
  // prompt can be run for flashcards today and a mixed set tomorrow. Each one pulls
  // its own rules into the prompt, and the model picks a shape per question.
  const [types, setTypes] = useState<string[]>(["single_choice"]);
  const [minCount, setMinCount] = useState("6");
  const [maxCount, setMaxCount] = useState("20");
  const [picked, setPicked] = useState<string[]>(
    defaultAnchor ? [defaultAnchor] : [],
  );
  const switchOutline = (id: string) => {
    setOutlineId(id);
    // Anchors belong to one version's headings.
    setPicked([]);
    setCollapsed([]);
  };
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [kinds, setKinds] = useState<QaItemKind[]>([]);
  // The price is stated in a second dialog on Run, not inline: it is the last thing
  // read before money is spent.
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [started, setStarted] = useState<{
    id: string;
    reused: boolean;
  } | null>(null);

  const usableTemplates = (templates.data ?? []).filter((row) => row.enabled);

  // An outline without headings has no sections to pick: the only run left is the
  // whole document, which the backend takes as `allSections`.
  const noSections = sections.length === 0 && !loadingSections;
  // Every section ticked is the same request as "all", and the backend takes it as the
  // explicit `allSections` flag rather than a list that happens to be complete.
  const allPicked = sections.length > 0 && picked.length === sections.length;
  const wholeOutline = allPicked || noSections;
  const chosenCount = picked.length;
  // A blank bound means "no limit on this side"; the model decides.
  const minValue = minCount.trim() === "" ? undefined : Number(minCount);
  const maxValue = maxCount.trim() === "" ? undefined : Number(maxCount);
  const inBounds = (value: number | undefined) =>
    value === undefined ||
    (Number.isInteger(value) && value >= 1 && value <= MAX_RUN_ITEMS);
  const rangeValid =
    inBounds(minValue) &&
    inBounds(maxValue) &&
    (minValue === undefined || maxValue === undefined || minValue <= maxValue);
  const countText =
    minValue !== undefined && maxValue !== undefined
      ? t("generate.countBoth", { min: minValue, max: maxValue })
      : minValue !== undefined
        ? t("generate.countMin", { min: minValue })
        : maxValue !== undefined
          ? t("generate.countMax", { max: maxValue })
          : t("generate.countAny");
  const modelInfo = aiRun.modelInfo;
  const pickedAnchors = wholeOutline
    ? sections.map((section) => section.anchor)
    : picked;
  // Blocked here rather than after the click: the sections' size and the model's
  // limits are both known, and the outline itself has no size cap.
  const fit =
    modelInfo && pickedAnchors.length > 0 && rangeValid
      ? checkRunFit({
          entries: sections,
          anchors: pickedAnchors,
          maxCount: maxValue,
          model: modelInfo,
        })
      : ({ ok: true, calls: 1 } as const);
  const canRun =
    fit.ok &&
    templateId !== "" &&
    types.length > 0 &&
    (chosenCount > 0 || noSections) &&
    rangeValid &&
    !loadingSections &&
    aiRun.ready;

  // `sections` arrive flat, in outline order, so a section's children are the run of
  // deeper-level entries right after it.
  const subtreeOf = (index: number): string[] => {
    const { level } = sections[index];
    const anchors = [sections[index].anchor];
    for (
      let i = index + 1;
      i < sections.length && sections[i].level > level;
      i += 1
    ) {
      anchors.push(sections[i].anchor);
    }
    return anchors;
  };

  // Ticking a parent ticks everything under it; unticking clears the same set. A
  // child can still be toggled alone, which leaves its parent half-ticked.
  const toggleSubtree = (index: number) => {
    const subtree = subtreeOf(index);
    setPicked((current) => {
      const allPicked = subtree.every((anchor) => current.includes(anchor));
      return allPicked
        ? current.filter((anchor) => !subtree.includes(anchor))
        : [...new Set([...current, ...subtree])];
    });
  };

  const toggleCollapsed = (anchor: string) =>
    setCollapsed((current) =>
      current.includes(anchor)
        ? current.filter((value) => value !== anchor)
        : [...current, anchor],
    );

  // Pointer-only: the field is cleared from the keyboard by deleting its text.
  const clearButton = (value: string, clear: () => void) =>
    value === "" ? null : (
      <button
        type="button"
        tabIndex={-1}
        aria-label={tc("actions.clear")}
        onClick={clear}
        className="flex size-5 items-center justify-center rounded hover:bg-muted"
      >
        <Icon icon={ICONS.close} className="size-4" />
      </button>
    );

  const run = async () => {
    if (!aiRun.credential) return;
    setConfirming(false);
    setFormError(null);
    try {
      const result = await generate.mutateAsync({
        outlineId,
        templateId,
        questionTypes: QA_TEMPLATE_KEYS.filter((shape) =>
          types.includes(shape),
        ),
        credentialId: aiRun.credential.id,
        ...(minValue !== undefined ? { minCount: minValue } : {}),
        ...(maxValue !== undefined ? { maxCount: maxValue } : {}),
        ...(kinds.length > 0 ? { itemKinds: kinds } : {}),
        ...(wholeOutline ? { allSections: true } : { sectionAnchors: picked }),
      });
      if (onStarted) {
        onStarted(result.generationId);
        onClose();
      } else {
        setStarted({ id: result.generationId, reused: result.reused });
      }
    } catch (error) {
      // QA_OUTPUT_EXCEEDED and QA_SECTION_NOT_FOUND both arrive with their
      // numbers already in the sentence — how many sections fit, which anchors
      // are stale. Rewriting them would throw the useful half away.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog open onClose={onClose} size="lg" title={t("generate.title")}>
      {started ? (
        <GenerationProgress generationId={started.id} reused={started.reused} />
      ) : (
        <div className="space-y-5">
          {/* What to generate from. */}
          <div className="space-y-4">
            {datasetId && (versions.data?.items.length ?? 0) > 1 ? (
              <div className="sm:w-72">
                <Select
                  label={t("ws.meta.versionLabel")}
                  value={outlineId}
                  onChange={(event) => switchOutline(event.target.value)}
                  options={(versions.data?.items ?? []).map((outline) => ({
                    value: outline.id,
                    // A named version shows its name; "v*" is only the fallback.
                    label:
                      outline.label?.trim() ||
                      t("outlines.versionShort", { version: outline.version }),
                  }))}
                />
              </div>
            ) : null}
            {/* No headings means nothing to pick: the run is the whole document and
              the cost confirmation says so. */}
            {noSections ? null : (
              <fieldset className="space-y-2">
                <Typography variant="title-4" as="legend">
                  {t("generate.sections")}
                </Typography>
                {/* Spelled out, never a default: "no sections given" would be the
                most expensive request in the feature. */}
                <Checkbox
                  label={t("generate.allSections", { count: sections.length })}
                  checked={
                    allPicked
                      ? true
                      : picked.length === 0
                        ? false
                        : "indeterminate"
                  }
                  onCheckedChange={() =>
                    setPicked(
                      allPicked
                        ? []
                        : sections.map((section) => section.anchor),
                    )
                  }
                />
                <ul className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {sections.map((section, index) => {
                    // Hidden while any ancestor is collapsed.
                    let hidden = false;
                    let ceiling = section.level;
                    for (let i = index - 1; i >= 0 && !hidden; i -= 1) {
                      if (sections[i].level < ceiling) {
                        ceiling = sections[i].level;
                        hidden = collapsed.includes(sections[i].anchor);
                      }
                    }
                    if (hidden) return null;

                    const subtree = subtreeOf(index);
                    const hasChildren = subtree.length > 1;
                    const pickedCount = subtree.filter((anchor) =>
                      picked.includes(anchor),
                    ).length;
                    const state =
                      pickedCount === subtree.length
                        ? true
                        : pickedCount > 0
                          ? "indeterminate"
                          : false;
                    const isCollapsed = collapsed.includes(section.anchor);
                    return (
                      <li
                        key={section.anchor}
                        className="flex items-center gap-1"
                        style={{
                          paddingInlineStart: `${(section.level - 2) * 1.5}rem`,
                        }}
                      >
                        {hasChildren ? (
                          <button
                            type="button"
                            aria-expanded={!isCollapsed}
                            aria-label={t(
                              isCollapsed
                                ? "generate.expandChildren"
                                : "generate.collapseChildren",
                            )}
                            onClick={() => toggleCollapsed(section.anchor)}
                            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                          >
                            <Icon
                              icon={
                                isCollapsed
                                  ? ICONS.chevronRight
                                  : ICONS.chevronDown
                              }
                              animate="snappy"
                              className="size-4"
                            />
                          </button>
                        ) : (
                          <span
                            className="size-5 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <Checkbox
                          label={section.title}
                          checked={state}
                          onCheckedChange={() => toggleSubtree(index)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            )}
          </div>

          {/* What to generate. */}
          <div className="space-y-4 border-t border-border pt-5">
            <div>
              <Select
                label={t("generate.template")}
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                placeholder={
                  usableTemplates.length === 0
                    ? t("generate.noTemplate")
                    : t("generate.pickTemplate")
                }
                options={usableTemplates.map((row) => ({
                  value: row.id,
                  label: row.name,
                }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="flex items-center gap-1">
                  <Typography variant="title-4" as="span">
                    {t("generate.questionTypes")}
                  </Typography>
                  {/* The long explanation lives behind the icon to keep the row short. */}
                  <Tooltip label={t("generate.questionTypesHint")}>
                    <span className="flex text-muted-foreground">
                      <Icon icon={LUCIDE.info} className="size-4" />
                    </span>
                  </Tooltip>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {QA_TEMPLATE_KEYS.map((shape) => {
                    const on = types.includes(shape);
                    const name = t(`templates.shapes.${shape}`);
                    return (
                      <Tooltip key={shape} label={name}>
                        <Button
                          type="button"
                          size="icon-md"
                          variant={on ? "primary" : "outline"}
                          aria-label={name}
                          aria-pressed={on}
                          onClick={() =>
                            setTypes((current) =>
                              on
                                ? current.filter((value) => value !== shape)
                                : [...current, shape],
                            )
                          }
                        >
                          <Icon icon={SHAPE_ICONS[shape]} />
                        </Button>
                      </Tooltip>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <Typography variant="title-4" as="legend">
                  {t("generate.kinds")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {ITEM_KINDS.map((value) => {
                    const on = kinds.includes(value);
                    const name = t(`items.kinds.${value}`);
                    return (
                      <Tooltip key={value} label={name}>
                        <Button
                          type="button"
                          size="icon-md"
                          variant={on ? "primary" : "outline"}
                          aria-label={name}
                          aria-pressed={on}
                          onClick={() =>
                            setKinds((current) =>
                              on
                                ? current.filter((kind) => kind !== value)
                                : [...current, value],
                            )
                          }
                        >
                          <Icon icon={KIND_ICONS[value]} />
                        </Button>
                      </Tooltip>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
                <Input
                  label={t("generate.minCount")}
                  type="number"
                  min={1}
                  value={minCount}
                  onChange={(event) => setMinCount(event.target.value)}
                  trailing={clearButton(minCount, () => setMinCount(""))}
                />
                <Input
                  label={t("generate.maxCount")}
                  type="number"
                  min={1}
                  value={maxCount}
                  onChange={(event) => setMaxCount(event.target.value)}
                  trailing={clearButton(maxCount, () => setMaxCount(""))}
                />
              </div>
              <Typography variant="body-4" className="text-muted-foreground">
                {t("generate.countHint")}
              </Typography>
            </div>
          </div>

          {/* Who pays. */}
          <div className="border-t border-border pt-5">{aiRun.fields}</div>

          {/* State the price before the click: how many sections × how many
              questions, on which key and model. */}
          {aiRun.empty ? (
            <AlertError message={t("run.noCredentialHint")} />
          ) : !fit.ok ? (
            <AlertError
              message={
                fit.reason === "section"
                  ? t("generate.sectionTooLong", {
                      title: fit.title,
                      // Numbers, not strings: the messages pluralise on them.
                      tokens: fit.tokens.toLocaleString("en-US"),
                      budget: fit.budget.toLocaleString("en-US"),
                      model: fit.model,
                    })
                  : fit.reason === "model"
                    ? t("generate.modelTooSmall", { model: fit.model })
                    : t("generate.outputExceeded", {
                        max: fit.maxCount,
                        capacity: fit.capacity.toLocaleString("en-US"),
                        calls: fit.calls,
                        sections: fit.sections,
                        model: fit.model,
                      })
              }
            />
          ) : fit.calls > 1 ? (
            <Typography variant="body-4" className="text-muted-foreground">
              {t("generate.calls", { calls: fit.calls })}
            </Typography>
          ) : null}

          {formError ? <AlertError message={m(formError)} /> : null}
        </div>
      )}

      {/* Nút ở CUỐI nội dung, không phải ở `actions` — `actions` của Dialog là
          thanh công cụ cạnh nút đóng trên header. */}
      <div className="mt-4 flex justify-end gap-2">
        {started ? (
          <Button onClick={onClose}>{tc("actions.close")}</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              {tc("actions.cancel")}
            </Button>
            <Button
              onClick={() => setConfirming(true)}
              disabled={!canRun}
              loading={generate.isPending}
            >
              {t("generate.confirm")}
            </Button>
          </>
        )}
      </div>
      {confirming && aiRun.credential ? (
        <Dialog
          open
          onClose={() => setConfirming(false)}
          size="md"
          title={t("generate.confirmTitle")}
        >
          <Typography variant="body-3">
            {t(noSections ? "generate.costWhole" : "generate.cost", {
              sections: chosenCount,
              count: countText,
              key: aiRun.credential.label,
              model: aiRun.model,
            })}
            {fit.ok && fit.calls > 1
              ? ` ${t("generate.calls", { calls: fit.calls })}`
              : ""}
          </Typography>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {tc("actions.cancel")}
            </Button>
            <Button onClick={() => void run()}>{t("generate.confirm")}</Button>
          </div>
        </Dialog>
      ) : null}
    </Dialog>
  );
}
