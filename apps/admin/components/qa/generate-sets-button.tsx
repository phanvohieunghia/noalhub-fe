"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useMe } from "@noalhub/api/auth";
import type { Message } from "@noalhub/api/message";
import {
  useAiCredentials,
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
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";

import { GenerationProgress } from "./generation-progress";

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
}: {
  outlineId: string;
  sections: QaOutlineEntry[];
}) {
  const t = useTranslations("admin.qa");
  const me = useMe();
  const [open, setOpen] = useState(false);

  if (!me.data?.canGenerateAi) return null;

  return (
    <>
      <Button disabled={sections.length === 0} onClick={() => setOpen(true)}>
        {t("generate.button")}
      </Button>
      {open ? (
        <GenerateDialog
          outlineId={outlineId}
          sections={sections}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function GenerateDialog({
  outlineId,
  sections,
  onClose,
}: {
  outlineId: string;
  sections: QaOutlineEntry[];
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const templates = useQaTemplates("qa");
  const credentials = useAiCredentials();
  const generate = useGenerateSets();

  const [templateId, setTemplateId] = useState("");
  const [count, setCount] = useState("10");
  const [picked, setPicked] = useState<string[]>([]);
  const [allSections, setAllSections] = useState(false);
  const [kinds, setKinds] = useState<QaItemKind[]>(["theory", "practice"]);
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [started, setStarted] = useState<{ id: string; reused: boolean } | null>(null);

  const usableTemplates = (templates.data ?? []).filter((row) => row.enabled);
  const defaultCredential = (credentials.data ?? []).find(
    (row) => row.isDefault && row.enabled,
  );

  const chosenCount = allSections ? sections.length : picked.length;
  const countValue = Number(count) || 0;
  const canRun =
    templateId !== "" && chosenCount > 0 && countValue > 0 && kinds.length > 0;

  const toggleSection = (anchor: string) =>
    setPicked((current) =>
      current.includes(anchor)
        ? current.filter((value) => value !== anchor)
        : [...current, anchor],
    );

  const run = async () => {
    setFormError(null);
    try {
      const result = await generate.mutateAsync({
        outlineId,
        templateId,
        count: countValue,
        itemKinds: kinds,
        ...(allSections ? { allSections: true } : { sectionAnchors: picked }),
      });
      setStarted({ id: result.generationId, reused: result.reused });
    } catch (error) {
      // QA_OUTPUT_EXCEEDED and QA_SECTION_NOT_FOUND both arrive with their
      // numbers already in the sentence — how many sections fit, which anchors
      // are stale. Rewriting them would throw the useful half away.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="fullscreen"
      title={t("generate.title")}
      actions={
        started ? (
          <Button onClick={onClose}>{tc("actions.close")}</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {tc("actions.cancel")}
            </Button>
            <Button onClick={() => void run()} disabled={!canRun || generate.isPending}>
              {t("generate.confirm")}
            </Button>
          </div>
        )
      }
    >
      {started ? (
        <GenerationProgress generationId={started.id} reused={started.reused} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Input
              label={t("generate.count")}
              type="number"
              min={1}
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-title-4">{t("generate.kinds")}</legend>
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
            <legend className="text-title-4">{t("generate.sections")}</legend>
            {/* Spelled out, never a default: "no sections given" would be the
                most expensive request in the feature. */}
            <Checkbox
              label={t("generate.allSections", { count: sections.length })}
              checked={allSections}
              onCheckedChange={(checked) => setAllSections(checked === true)}
            />
            {!allSections ? (
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {sections.map((section) => (
                  <li
                    key={section.anchor}
                    className={
                      section.level === 4 ? "pl-8" : section.level === 3 ? "pl-4" : ""
                    }
                  >
                    <Checkbox
                      label={section.title}
                      checked={picked.includes(section.anchor)}
                      onCheckedChange={() => toggleSection(section.anchor)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </fieldset>

          {/* State the price before the click: how many sections × how many
              questions, on which key and model. */}
          <AlertInfo
            message={
              defaultCredential
                ? t("generate.cost", {
                    sections: chosenCount,
                    count: countValue,
                    key: defaultCredential.label,
                    model: defaultCredential.defaultModel,
                  })
                : t("analyze.noCredential")
            }
          />

          {formError ? <AlertError message={m(formError)} /> : null}
        </div>
      )}
    </Dialog>
  );
}
