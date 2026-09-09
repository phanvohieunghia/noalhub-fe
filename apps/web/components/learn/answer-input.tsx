"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { QaItemPlay, QaResponse, QaTemplateKey } from "@noalhub/api/qa";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Input } from "@noalhub/ui/input";

/**
 * The three ways to answer, picked by the SET's shape — not by whether the item
 * happens to have options.
 *
 * That distinction is the whole reason `templateKey` exists on the DTO: a
 * flashcard has no options either, and inferring from their absence would give
 * it a text box instead of "I knew it / I didn't".
 */
export function AnswerInput({
  templateKey,
  item,
  disabled,
  onSubmit,
}: {
  templateKey: QaTemplateKey;
  item: QaItemPlay;
  disabled?: boolean;
  onSubmit: (response: QaResponse) => void;
}) {
  const t = useTranslations("web.learn");
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);

  if (templateKey === "flashcard") {
    return (
      <div className="space-y-3">
        {!revealed ? (
          <Button onClick={() => setRevealed(true)}>{t("answer.flip")}</Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* Self-assessed, and the copy says so: the result lands in the
                `self` bucket of the stats and is never mixed with machine
                grading. */}
            <Button disabled={disabled} onClick={() => onSubmit({ known: true })}>
              {t("answer.known")}
            </Button>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => onSubmit({ known: false })}
            >
              {t("answer.unknown")}
            </Button>
          </div>
        )}
        <p className="text-body-4 text-muted-foreground">{t("answer.selfNote")}</p>
      </div>
    );
  }

  if (item.options && item.options.length > 0) {
    const single = templateKey === "true_false";
    return (
      <div className="space-y-3">
        <ul className="space-y-2">
          {item.options.map((option) => (
            <li key={option.id}>
              <Checkbox
                label={option.text}
                checked={picked.includes(option.id)}
                onCheckedChange={(checked) =>
                  setPicked((current) => {
                    if (single) return checked === true ? [option.id] : [];
                    return checked === true
                      ? [...current, option.id]
                      : current.filter((id) => id !== option.id);
                  })
                }
              />
            </li>
          ))}
        </ul>
        <Button
          disabled={disabled || picked.length === 0}
          onClick={() => onSubmit({ optionIds: picked })}
        >
          {t("answer.submit")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        label={t("answer.text")}
        value={text}
        hint={t("answer.textHint")}
        onChange={(event) => setText(event.target.value)}
      />
      <Button
        disabled={disabled || text.trim() === ""}
        onClick={() => onSubmit({ text })}
      >
        {t("answer.submit")}
      </Button>
    </div>
  );
}
