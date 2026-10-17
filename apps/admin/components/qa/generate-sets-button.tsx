"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useMe } from "@noalhub/api/auth";
import type { Message } from "@noalhub/api/message";
import {
  MAX_RUN_ITEMS,
  QA_TEMPLATE_KEYS,
  useAiModels,
  useGenerateSets,
  useQaTemplates,
  type QaItemKind,
  type QaOutlineEntry,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertInfo } from "@noalhub/ui/alert";
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

const ITEM_KINDS = ["theory", "practice", "recall", "analysis"] as const;

/**
 * The second button that spends money.
 *
 * Sections must be picked, or "all" ticked deliberately — the backend refuses a
 * request with neither, and that refusal is the point: "empty means everything"
 * is the most expensive default available and the easiest to hit by forgetting
 * a field.
 */
export function GenerateSetsButton({
  outlineId,
  sections,
  defaultAnchor,
  label,
  iconOnly = false,
  onStarted,
}: {
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
            disabled={sections.length === 0}
            onClick={() => setOpen(true)}
          >
            <Icon icon={LUCIDE.sparkles} />
          </Button>
        </Tooltip>
      ) : (
        <Button disabled={sections.length === 0} onClick={() => setOpen(true)}>
          {label ?? t("generate.button")}
        </Button>
      )}
      {open ? (
        <GenerateDialog
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
  outlineId,
  sections,
  defaultAnchor,
  onStarted,
  onClose,
}: {
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
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [allSections, setAllSections] = useState(false);
  const [kinds, setKinds] = useState<QaItemKind[]>(["theory", "practice"]);
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [started, setStarted] = useState<{
    id: string;
    reused: boolean;
  } | null>(null);

  const usableTemplates = (templates.data ?? []).filter((row) => row.enabled);

  const chosenCount = allSections ? sections.length : picked.length;
  const minValue = Number(minCount) || 0;
  const maxValue = Number(maxCount) || 0;
  const rangeValid =
    minValue >= 1 && maxValue >= minValue && maxValue <= MAX_RUN_ITEMS;
  const models = useAiModels();
  const modelInfo = (models.data ?? []).find((row) => row.id === aiRun.model);
  const pickedAnchors = allSections
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
      : ({ ok: true } as const);
  const canRun =
    fit.ok &&
    templateId !== "" &&
    types.length > 0 &&
    chosenCount > 0 &&
    rangeValid &&
    kinds.length > 0 &&
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

  const run = async () => {
    if (!aiRun.credential) return;
    setFormError(null);
    try {
      const result = await generate.mutateAsync({
        outlineId,
        templateId,
        questionTypes: QA_TEMPLATE_KEYS.filter((shape) =>
          types.includes(shape),
        ),
        credentialId: aiRun.credential.id,
        model: aiRun.model,
        minCount: minValue,
        maxCount: maxValue,
        itemKinds: kinds,
        ...(allSections ? { allSections: true } : { sectionAnchors: picked }),
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
        <div className="space-y-4">
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

          <fieldset className="space-y-2">
            <Typography variant="title-4" as="legend">
              {t("generate.questionTypes")}
            </Typography>
            <div className="flex flex-wrap gap-3">
              {QA_TEMPLATE_KEYS.map((shape) => (
                <Checkbox
                  key={shape}
                  label={t(`templates.shapes.${shape}`)}
                  checked={types.includes(shape)}
                  onCheckedChange={(checked) =>
                    setTypes((current) =>
                      checked === true
                        ? [...current, shape]
                        : current.filter((value) => value !== shape),
                    )
                  }
                />
              ))}
            </div>
            <Typography variant="body-4" className="text-muted-foreground">
              {t("generate.questionTypesHint")}
            </Typography>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("generate.minCount")}
              type="number"
              min={1}
              value={minCount}
              onChange={(event) => setMinCount(event.target.value)}
            />
            <Input
              label={t("generate.maxCount")}
              type="number"
              min={1}
              value={maxCount}
              onChange={(event) => setMaxCount(event.target.value)}
            />
          </div>
          <Typography variant="body-4" className="-mt-2 text-muted-foreground">
            {t("generate.countHint")}
          </Typography>

          {aiRun.fields}

          <fieldset className="space-y-2">
            <Typography variant="title-4" as="legend">
              {t("generate.kinds")}
            </Typography>
            <div className="flex flex-wrap gap-3">
              {ITEM_KINDS.map((value) => (
                <Checkbox
                  key={value}
                  label={t(`items.kinds.${value}`)}
                  checked={kinds.includes(value)}
                  onCheckedChange={(checked) =>
                    setKinds((current) =>
                      checked === true
                        ? [...current, value]
                        : current.filter((kind) => kind !== value),
                    )
                  }
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <Typography variant="title-4" as="legend">
              {t("generate.sections")}
            </Typography>
            {/* Spelled out, never a default: "no sections given" would be the
                most expensive request in the feature. */}
            <Checkbox
              label={t("generate.allSections", { count: sections.length })}
              checked={allSections}
              onCheckedChange={(checked) => setAllSections(checked === true)}
            />
            {!allSections ? (
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
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
                            className="size-4"
                          />
                        </button>
                      ) : (
                        <span className="size-5 shrink-0" aria-hidden="true" />
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
            ) : null}
          </fieldset>

          {/* State the price before the click: how many sections × how many
              questions, on which key and model. */}
          {aiRun.empty ? (
            <AlertError message={t("run.noCredentialHint")} />
          ) : !fit.ok ? (
            <AlertError
              message={
                fit.reason === "context"
                  ? t("generate.contextExceeded", {
                      chars: fit.chars.toLocaleString("en-US"),
                      tokens: fit.tokens.toLocaleString("en-US"),
                      window: fit.window.toLocaleString("en-US"),
                      model: fit.model,
                    })
                  : t("generate.outputExceeded", {
                      max: fit.maxCount,
                      capacity: fit.capacity.toLocaleString("en-US"),
                      model: fit.model,
                    })
              }
            />
          ) : aiRun.credential && aiRun.ready ? (
            <AlertInfo
              message={t("generate.cost", {
                sections: chosenCount,
                min: minValue,
                max: maxValue,
                key: aiRun.credential.label,
                model: aiRun.model,
              })}
            />
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
              onClick={() => void run()}
              disabled={!canRun || generate.isPending}
            >
              {t("generate.confirm")}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
