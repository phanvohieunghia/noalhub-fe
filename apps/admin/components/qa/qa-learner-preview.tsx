"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  useQaItemSearch,
  useQaItemTags,
  useQaSet,
  type QaItemSearchRow,
} from "@noalhub/api/qa";
import { QaContent } from "@noalhub/ui/blog/qa-content";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import type { BlogDoc } from "@noalhub/api/blog";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { QaOptionCard } from "@noalhub/ui/qa-option-card";
import { Skeleton } from "@noalhub/ui/skeleton";
import { TaggedFrame, pickTagLabel } from "@noalhub/ui/tag-mark";
import { Toggle, type ToggleOption } from "@noalhub/ui/toggle";
import { Typography } from "@noalhub/ui/typography";

type ShapeKey = "multiple_choice";

const DEVICES = ["mobile", "tablet", "laptop"] as const;
type Device = (typeof DEVICES)[number];
const DEVICE_ICONS = {
  mobile: LUCIDE.smartphone,
  tablet: LUCIDE.tablet,
  laptop: LUCIDE.laptop,
} as const;
/** The learner screen's size per device; the laptop takes whatever width the dialog gives. */
const DEVICE_FRAMES: Record<Device, string> = {
  mobile: "h-[720px] max-w-[390px]",
  tablet: "h-[760px] max-w-[768px]",
  laptop: "h-[620px] max-w-full",
};
/** Same rule as the learner's `AnswerInput`: short, even-numbered answers sit two to a row. */
const SHORT_OPTION_CHARS = 40;

/**
 * A modal showing one question exactly as a learner sees it, per shape: choice
 * rows, a text field, or the flashcard self-grade buttons. Read-only: publishing
 * is decided per question type on the list, not here.
 *
 * The header (shape and set title) is the learner's own frame, drawn on purpose.
 * There is no progress bar or "N correct" badge: nobody is answering here.
 */
export function QaLearnerPreview({
  item,
  onClose,
  controls,
}: {
  item: QaItemSearchRow;
  onClose: () => void;
  /** Extra controls under the device switch — the type preview's "what if" example picker. */
  controls?: React.ReactNode;
}) {
  const t = useTranslations("admin.qa");
  const set = useQaSet(item.setId);
  const locale = useLocale();
  const tags = useQaItemTags();
  // Starts from the tags the question really carries. Ticking more is what-if only —
  // nothing here is saved; it lets an admin see how another tag would sit on the question.
  const [picked, setPicked] = useState<readonly string[]>(item.tagIds);
  const [device, setDevice] = useState<Device>("laptop");
  // What-if answer picks, so the cards can be seen in their picked state. Never sent anywhere.
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const activeTags = (tags.data ?? []).filter((tag) => tag.active);
  const shown = activeTags.filter((tag) => picked.includes(tag.id));

  const shape = t(`templates.shapes.${item.type}` as `templates.shapes.${ShapeKey}`);
  const isChoice = Boolean(item.options);
  const isMulti = item.type === "multiple_choice";
  const isFlashcard = item.type === "flashcard";
  const options = item.options ?? [];
  const compact =
    options.length % 2 === 0 && options.every((option) => option.text.length <= SHORT_OPTION_CHARS);

  return (
    <Dialog open size="xl" title={t("items.previewTitle")} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("items.previewIntro", { shape })}
        </Typography>

        {/* One toolbar: device, then the example picker; the what-if tags sit under a rule. */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <ToolGroup
              label={t("items.deviceLabel")}
              value={device}
              onChange={setDevice}
              options={DEVICES.map((value) => ({
                value,
                icon: DEVICE_ICONS[value],
                label: t(`items.devices.${value}`),
              }))}
            />
            {controls ? <Divider /> : null}
            {controls}
          </div>
          {activeTags.length > 0 ? (
            <div role="group" aria-label={t("items.previewTags")} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3">
              <Typography variant="body-4" as="span" className="mr-1 flex items-center gap-1.5 text-muted-foreground">
                <Icon icon={LUCIDE.tags} className="size-4" />
                {t("items.previewTags")}
              </Typography>
              {activeTags.map((tag) => (
                <Checkbox
                  key={tag.id}
                  size="sm"
                  label={pickTagLabel(tag.meta.label, locale, tag.key)}
                  checked={picked.includes(tag.id)}
                  onCheckedChange={(on) =>
                    setPicked((now) =>
                      on === true ? [...now, tag.id] : now.filter((id) => id !== tag.id),
                    )
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* The learner's screen at the device's width and a fixed height, the way `LearnAttempt`
            lays it out: header, progress, then the question and the answers filling what is left. */}
        <div
          className={`mx-auto flex w-full flex-col overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm transition-[max-width,height] sm:p-6 ${DEVICE_FRAMES[device]}`}
        >
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
            <header className="mb-6 shrink-0 space-y-3">
              <div className="flex items-center gap-2">
                <Icon icon={LUCIDE.arrowLeft} className="-ml-0.5 size-5 shrink-0 text-muted-foreground" />
                <Typography variant="h4" as="p" className="min-w-0 flex-1 truncate">
                  {set.data?.title ?? "\u00a0"}
                </Typography>
              </div>
              <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 rounded-full bg-primary" />
              </div>
            </header>

            <article className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="text-body-1 font-semibold">
                <TaggedFrame tags={shown} locale={locale}>
                  <QaContent doc={item.question} />
                </TaggedFrame>
              </div>

              {isChoice ? (
                <div className="flex min-h-0 flex-1 flex-col gap-5">
                  {isMulti ? (
                    <Typography variant="body-4" className="shrink-0 text-muted-foreground">
                      {t("items.previewMultiHint")}
                    </Typography>
                  ) : null}
                  <div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1">
                    <div
                      role={isMulti ? "group" : "radiogroup"}
                      className={`grid min-h-full auto-rows-fr gap-2 ${compact ? "grid-cols-2" : ""}`}
                    >
                      {options.map((option) => (
                        <QaOptionCard
                          key={option.id}
                          text={option.text}
                          role={isMulti ? "checkbox" : "radio"}
                          shape={isMulti ? "square" : "round"}
                          state={chosen.includes(option.id) ? "picked" : "idle"}
                          disabled={false}
                          centered={compact}
                          onClick={() =>
                            setChosen((now) =>
                              !isMulti
                                ? [option.id]
                                : now.includes(option.id)
                                  ? now.filter((id) => id !== option.id)
                                  : [...now, option.id],
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {isFlashcard ? (
                <div className="space-y-3">
                  <Typography variant="body-3" className="text-muted-foreground">
                    {t("items.previewFlashHint")}
                  </Typography>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button disabled>
                      <Icon icon={LUCIDE.circleCheck} />
                      {t("items.previewKnewIt")}
                    </Button>
                    <Button variant="outline" disabled>
                      <Icon icon={LUCIDE.circleX} />
                      {t("items.previewDidntKnow")}
                    </Button>
                  </div>
                  <Typography variant="body-4" className="text-muted-foreground">
                    {t("items.previewFlashNote")}
                  </Typography>
                </div>
              ) : null}

              {!isChoice && !isFlashcard ? (
                <Input
                  label={t("items.previewAnswer")}
                  hint={t("items.previewAnswerHint")}
                  disabled
                  readOnly
                />
              ) : null}
            </article>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/** How many of the type's newest questions are looked through for a good example. */
const SAMPLE_POOL = 100;

/** Characters of text in a rich-text node, plus a bonus per picture — a rough "how much is in it". */
function weight(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const { text, content, type } = node as { text?: string; content?: unknown[]; type?: string };
  const own = typeof text === "string" ? text.length + (text.match(/!\[[^\]]*\]\(/g)?.length ?? 0) * 200 : 0;
  const image = type === "image" ? 200 : 0;
  return own + image + (Array.isArray(content) ? content.reduce<number>((sum, child) => sum + weight(child), 0) : 0);
}

/**
 * The example for a type: a placeholder like "test / A B C D" says nothing about how the
 * screen holds up, so prefer the question with the most going on (a picture, long text,
 * many or long options, tags) among the newest few.
 */
function richest(items: QaItemSearchRow[]): QaItemSearchRow | undefined {
  const score = (row: QaItemSearchRow) =>
    weight(row.question) +
    (row.options ?? []).reduce((sum, option) => sum + option.text.length, 0) +
    (row.options?.length ?? 0) * 20 +
    row.tagIds.length * 100;
  return items.reduce<QaItemSearchRow | undefined>(
    (best, row) => (!best || score(row) > score(best) ? row : best),
    undefined,
  );
}

/** The toolbar's thin vertical rule between groups. */
function Divider() {
  return <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />;
}

/** One group of the preview toolbar: icon-only choices, each named by its tooltip. */
function ToolGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: readonly ToggleOption<T>[];
}) {
  return <Toggle variant="filter" aria-label={label} value={value} onValueChange={onChange} options={options} />;
}

type ImageNode = Extract<BlogDoc["content"][number], { type: "image" }>;

/** The first picture found anywhere in a rich-text doc. */
function findImage(node: unknown): ImageNode | null {
  if (!node || typeof node !== "object") return null;
  const { type, content } = node as { type?: string; content?: unknown[] };
  if (type === "image") return node as ImageNode;
  if (!Array.isArray(content)) return null;
  for (const child of content) {
    const found = findImage(child);
    if (found) return found;
  }
  return null;
}

type Source = "real" | "sample";
type Length = "short" | "long";
const COUNT_OPTIONS = [
  { value: "2", icon: LUCIDE.dice2 },
  { value: "3", icon: LUCIDE.dice3 },
  { value: "4", icon: LUCIDE.dice4 },
  { value: "5", icon: LUCIDE.dice5 },
] as const;

/**
 * The preview of a question *type*: opens the modal on one question of that type —
 * the one with the most in it — or, on request, on a made-up example whose parts the
 * admin picks: with or without a picture, a short or long question, short or long
 * answers, and 2 to 5 of them. The example reuses the real question's set and tags;
 * only the texts are invented, and a picture is borrowed from a real question (the
 * image hosts are allow-listed, so there is no URL to invent). Nothing is saved.
 */
export function QaTypePreview({
  type,
  onClose,
}: {
  type: string;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const search = useQaItemSearch({ type, limit: SAMPLE_POOL });
  const pool = search.data?.items;
  const base = useMemo(() => richest(pool ?? []), [pool]);
  const image = useMemo(() => {
    for (const row of pool ?? []) {
      const found = findImage(row.question);
      if (found) return found;
    }
    return null;
  }, [pool]);

  const [source, setSource] = useState<Source>("real");
  const [withImage, setWithImage] = useState<"yes" | "no">("no");
  const [question, setQuestion] = useState<Length>("short");
  const [answers, setAnswers] = useState<Length>("short");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]["value"]>("4");

  const hasOptions = Boolean(base?.options);
  // True/false is always two answers; the picker would only mislead there.
  const countable = hasOptions && type !== "true_false";

  const item = useMemo(() => {
    if (!base || source === "real") return base;
    const NUMBERS = [1, 2, 3, 4, 5] as const;
    const doc: BlogDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: question === "long" ? t("items.sample.questionLong") : t("items.sample.questionShort") }],
        },
        ...(withImage === "yes" && image ? [image] : []),
      ],
    } as BlogDoc;
    const texts = NUMBERS.map((n) =>
      answers === "long" ? t(`items.sample.answerLong${n}`) : t(`items.sample.answerShort${n}`),
    );
    const options = base.options
      ? texts.slice(0, countable ? Number(count) : base.options.length).map((text, index) => ({
          id: `sample-${index}`,
          text,
        }))
      : null;
    return { ...base, question: doc, options };
  }, [base, source, question, answers, count, withImage, image, countable, t]);

  if (item && base) {
    const lengths = (long: string, short: string): readonly ToggleOption<Length>[] => [
      { value: "short", icon: LUCIDE.minus, label: short },
      { value: "long", icon: LUCIDE.alignJustify, label: long },
    ];
    const controls = (
      <>
        <ToolGroup
          label={t("items.sample.source")}
          value={source}
          onChange={setSource}
          options={[
            { value: "real", icon: LUCIDE.database, label: t("items.sample.real") },
            { value: "sample", icon: LUCIDE.flaskConical, label: t("items.sample.example") },
          ]}
        />
        {source === "sample" ? (
          <>
            {image ? (
              <>
                <Divider />
                <ToolGroup
                  label={t("items.sample.picture")}
                  value={withImage}
                  onChange={setWithImage}
                  options={[
                    { value: "no", icon: LUCIDE.imageOff, label: t("items.sample.noPicture") },
                    { value: "yes", icon: LUCIDE.image, label: t("items.sample.withPicture") },
                  ]}
                />
              </>
            ) : null}
            <Divider />
            <ToolGroup
              label={t("items.sample.questionLength")}
              value={question}
              onChange={setQuestion}
              options={lengths(t("items.sample.long"), t("items.sample.short"))}
            />
            {hasOptions ? (
              <>
                <Divider />
                <ToolGroup
                  label={t("items.sample.answerLength")}
                  value={answers}
                  onChange={setAnswers}
                  options={lengths(t("items.sample.long"), t("items.sample.short"))}
                />
              </>
            ) : null}
            {countable ? (
              <>
                <Divider />
                <ToolGroup
                  label={t("items.sample.answerCount")}
                  value={count}
                  onChange={setCount}
                  options={COUNT_OPTIONS.map(({ value, icon }) => ({ value, icon, label: value }))}
                />
              </>
            ) : null}
          </>
        ) : null}
      </>
    );
    return <QaLearnerPreview key={base.id} item={item} onClose={onClose} controls={controls} />;
  }

  return (
    <Dialog open size="lg" title={t("items.previewTitle")} onClose={onClose}>
      {search.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Typography variant="body-3" className="text-muted-foreground">
          {t(search.isError ? "items.previewFailed" : "items.previewEmpty")}
        </Typography>
      )}
    </Dialog>
  );
}
