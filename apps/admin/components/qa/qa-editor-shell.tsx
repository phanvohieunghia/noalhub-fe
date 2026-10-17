"use client";

import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

import type { EditorFullscreen } from "@noalhub/ui/blog/tiptap-editor";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Switch } from "@noalhub/ui/switch";
import { Typography } from "@noalhub/ui/typography";

/**
 * The card both editors on the workbench sit in: a title on the left, a format
 * switch, Save and a full-screen button on the right, then the editor.
 *
 * The editor itself is supplied as a render function because both editors read
 * their `value` on mount only — entering or leaving full screen remounts it, so it
 * picks up whatever the parent holds at that moment. The parent owns the text;
 * nothing is lost by the remount.
 */
export function EditorShell({
  title,
  fullscreenTitle,
  switchLabel,
  switchOn,
  onSwitchChange,
  onSave,
  saving,
  canSave,
  error,
  fill = false,
  meta,
  actions,
  renderEditor,
}: {
  title: React.ReactNode;
  /** The title text shown in the full-screen window, where `title` may be a picker. */
  fullscreenTitle: string;
  /** Omit all three for an editor with a single mode. */
  switchLabel?: string;
  switchOn?: boolean;
  onSwitchChange?: (on: boolean) => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
  error?: string | null;
  /** Stretch the inline editor to the bottom of the viewport instead of a fixed scrollbox. */
  fill?: boolean;
  /** A quiet readout beside Save, e.g. a word count. Shown inline and in full screen. */
  meta?: React.ReactNode;
  /** Replaces the Save button in the header, e.g. an actions menu holding Save and more. */
  actions?: React.ReactNode;
  /**
   * `className` is the editable surface's size: a scrollbox inline, taller in full
   * screen. `fullscreen` goes to the editor, which draws the toggle as the first
   * button of its own toolbar.
   */
  renderEditor: (options: {
    className: string;
    fullscreen: EditorFullscreen;
  }) => React.ReactNode;
}) {
  const tc = useTranslations("common");
  const [full, setFull] = useState(false);
  const [generation, setGeneration] = useState(0);

  // `fill`: the editable surface (marked `qa-fit`) is stretched to end at the
  // bottom of the viewport, measured from wherever it actually sits — a guessed
  // `calc(100dvh - Nrem)` drifts the moment anything above it changes height.
  const inlineRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const wrapper = inlineRef.current;
    if (!fill || !wrapper) return;
    const fit = () => {
      const surface = wrapper.querySelector<HTMLElement>(".qa-fit");
      if (!surface) return;
      const top = surface.getBoundingClientRect().top;
      surface.style.height = `${Math.max(window.innerHeight - top - 48, 240)}px`;
    };
    fit();
    // The editor mounts its surface a beat after this shell does.
    const observer = new MutationObserver(fit);
    observer.observe(wrapper, { childList: true, subtree: true });
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", fit, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", fit, true);
    };
  });

  const toggleFull = (next: boolean) => {
    setFull(next);
    setGeneration((value) => value + 1);
  };

  const controls = (
    <>
      {meta}
      {switchLabel && onSwitchChange ? (
        <>
          <Typography variant="body-4" className="text-muted-foreground">
            {switchLabel}
          </Typography>
          <Switch
            aria-label={switchLabel}
            checked={switchOn}
            onCheckedChange={onSwitchChange}
          />
        </>
      ) : null}
      {actions ?? (
        <Button size="sm" disabled={!canSave || saving} onClick={onSave}>
          {tc("actions.save")}
        </Button>
      )}
    </>
  );

  return (
    <>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <div className="min-w-0 flex-1">{title}</div>
          {controls}
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-3 p-4">
          {error ? (
            <Typography variant="body-4" className="text-danger" role="alert">
              {error}
            </Typography>
          ) : null}
          {full ? null : (
            <div key={`inline-${generation}`} ref={inlineRef}>
              {renderEditor({
                className: fill
                  ? "qa-fit min-h-[240px] overflow-y-auto"
                  : "min-h-[420px] max-h-[640px] overflow-y-auto",
                fullscreen: { active: false, onToggle: () => toggleFull(true) },
              })}
            </div>
          )}
        </div>
      </section>

      {full ? (
        <Dialog
          open
          size="inset"
          hideClose
          title={fullscreenTitle}
          onClose={() => toggleFull(false)}
          actions={controls}
        >
          <div
            key={`full-${generation}`}
            className="flex min-h-0 flex-1 flex-col"
          >
            {renderEditor({
              // The scrollbox is the editable surface itself, so the toolbar above it
              // stays in view while a long document scrolls.
              className: "h-full overflow-y-auto",
              fullscreen: { active: true, onToggle: () => toggleFull(false) },
            })}
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
