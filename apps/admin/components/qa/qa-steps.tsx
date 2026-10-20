"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ICONS, Icon } from "@noalhub/ui/icons";
import { Spinner } from "@noalhub/ui/spinner";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

export type WorkbenchStep = "sources" | "outline" | "sets" | "final";

const STEPS: readonly WorkbenchStep[] = ["sources", "outline", "sets", "final"];

/**
 * The dataset's four steps on one line: sources → outline → question sets → final
 * set. The tile of the open step is outlined in the primary colour; steps are not
 * numbered and carry no icon. Below 640px the tiles collapse into one dropdown with a
 * progress bar. From 640px they hug their content and sit centred on one row; once
 * they no longer fit the row becomes a swipeable snap ribbon with the open step
 * scrolled into view (the auto margins on the ends keep the centring from clipping). Each tile switches the workbench below, and says what that stage holds
 * right now — everything is derived from rows the page already loads.
 */
export function QaSteps({
  active,
  onSelect,
  generating = false,
  generatingSets = false,
}: {
  active: WorkbenchStep;
  onSelect: (step: WorkbenchStep) => void;
  /** An outline run is in flight: the outline tile shows it instead of the version. */
  generating?: boolean;
  /** A questions run is in flight: the question-sets tile shows it instead of the count. */
  generatingSets?: boolean;
}) {
  const t = useTranslations("admin.qa");
  const ribbon = useRef<HTMLDivElement>(null);
  const compact = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // The compact menu closes on an outside press or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPress = (event: PointerEvent) => {
      if (!compact.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPress);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPress);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Keep the open step in view when the ribbon is scrollable.
  useEffect(() => {
    const tile = ribbon.current?.querySelector<HTMLElement>(
      '[aria-current="step"]',
    )?.parentElement;
    tile?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const activeIndex = STEPS.indexOf(active);

  const summary: Record<WorkbenchStep, string | null> = {
    sources: null,
    outline: generating ? t("ws.meta.generating") : null,
    sets: generatingSets ? t("ws.meta.generating") : null,
    final: null,
  };

  return (
    <div className="@container">
      <div ref={compact} className="relative @min-[640px]:hidden">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          aria-label={t("ws.stepsLabel")}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center gap-3 rounded-lg border border-primary bg-surface px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Typography
            variant="title-3"
            className="min-w-0 flex-1 truncate text-foreground"
          >
            {t(`ws.steps.${active}`)}
          </Typography>
          {/* What the open step holds right now — the same line its tile shows. */}
          {summary[active] ? (
            <Typography
              variant="body-3"
              className="min-w-0 shrink truncate text-muted-foreground"
            >
              {summary[active]}
            </Typography>
          ) : null}
          <Icon
            icon={ICONS.chevronDown}
            className={`size-6 shrink-0 text-foreground transition-transform ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          {STEPS.map((step, index) => (
            <span
              key={step}
              className={`h-1 min-w-px flex-1 rounded-full ${
                index <= activeIndex ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
        {menuOpen ? (
          <ul
            role="listbox"
            aria-label={t("ws.stepsLabel")}
            className="absolute inset-x-0 top-full z-30 mt-2 flex flex-col gap-1 rounded-xl border border-border bg-surface p-2 shadow-lg"
          >
            {STEPS.map((step) => (
              <li key={step} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={step === active}
                  onClick={() => {
                    onSelect(step);
                    setMenuOpen(false);
                  }}
                  className={`flex h-[52px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                    step === active ? "bg-muted" : ""
                  }`}
                >
                  <Typography
                    variant={step === active ? "title-3" : "body-3"}
                    className={`min-w-0 flex-1 truncate ${
                      step === active ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {t(`ws.steps.${step}`)}
                  </Typography>
                  {summary[step] ? (
                    <Typography
                      variant={step === active ? "title-4" : "body-3"}
                      className="shrink-0 text-muted-foreground"
                    >
                      {summary[step]}
                    </Typography>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div
        ref={ribbon}
        aria-label={t("ws.stepsLabel")}
        className="-mx-4 hidden snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] items-center @min-[640px]:flex [&::-webkit-scrollbar]:hidden [&>:first-child]:ml-auto [&>:last-child]:mr-auto"
      >
        {STEPS.map((step, index) => (
          <div
            key={step}
            className="flex shrink-0 snap-start items-center gap-2"
          >
            {index > 0 ? (
              <Icon
                icon={ICONS.chevronRight}
                className="size-6 shrink-0 text-foreground"
              />
            ) : null}
            <div
              className={`relative flex min-w-0 items-center gap-3 rounded-lg border bg-surface px-4 py-3.5 ${
                step === active ? "border-primary" : "border-border"
              }`}
            >
              {/* The whole tile is the button; the version picker sits above it. */}
              <button
                type="button"
                aria-current={step === active ? "step" : undefined}
                aria-label={t(`ws.steps.${step}`)}
                onClick={() => onSelect(step)}
                className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <div className="pointer-events-none flex min-w-0 items-center gap-6">
                <Typography
                  variant="title-3"
                  className="min-w-0 truncate text-foreground"
                >
                  {t(`ws.steps.${step}`)}
                </Typography>

                {summary[step] ? (
                  <Tooltip label={summary[step]}>
                    <div
                      role="status"
                      aria-label={summary[step]}
                      className="pointer-events-auto relative z-10 flex shrink-0 items-center text-primary"
                    >
                      <Spinner size="sm" />
                    </div>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
