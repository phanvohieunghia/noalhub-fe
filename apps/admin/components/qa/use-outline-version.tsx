"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useQaOutlines, type QaOutlineSummary } from "@noalhub/api/qa";
import { Select } from "@noalhub/ui/select";

/**
 * Which outline version a step looks at. Versions are append-only history: there is
 * no "active" one to switch, so a step simply opens on the newest and the picker only
 * changes what it is showing. Until something is picked, the newest is followed — a
 * version generated while the page is open takes over by itself.
 */
/** Picker value for the version a run is still writing; it has no row on the server yet. */
export const PENDING_VERSION = "pending";

export function useOutlineVersion(datasetId: string) {
  const outlines = useQaOutlines(datasetId);
  const [picked, setPicked] = useState<string | null>(null);
  const items = outlines.data?.items ?? [];

  let latest: QaOutlineSummary | undefined;
  for (const item of items) if (!latest || item.version > latest.version) latest = item;

  const selected = items.find((item) => item.id === picked) ?? latest;
  return { outlines, items, latest, selected, picked, select: setPicked };
}

/** The version picker. Purely a viewer: choosing one changes nothing on the server. */
export function OutlineVersionSelect({
  items,
  value,
  onChange,
  className = "w-28",
  pendingVersion,
}: {
  items: QaOutlineSummary[];
  /** The version number a running generation will produce; adds it as a pickable entry. */
  pendingVersion?: number;
  value: string | undefined;
  onChange: (id: string) => void;
  className?: string;
}) {
  const t = useTranslations("admin.qa");
  // Nothing to choose between — an empty dropdown reads as a broken control.
  if (items.length === 0 && pendingVersion === undefined) return null;
  return (
    <div className={className}>
      <Select
        label={t("ws.meta.versionLabel")}
        hideLabel
        size="sm"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        options={[
          ...(pendingVersion === undefined
            ? []
            : [
                {
                  value: PENDING_VERSION,
                  label: `${t("outlines.versionShort", { version: pendingVersion })}…`,
                },
              ]),
          ...items.map((outline) => ({
            value: outline.id,
            label: t("outlines.versionShort", { version: outline.version }),
          })),
        ]}
      />
    </div>
  );
}
