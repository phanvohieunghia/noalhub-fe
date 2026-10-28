"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  findSourceVariables,
  FORBIDDEN_PROMPT_VARIABLES,
  PROMPT_VARIABLES,
  useCreateQaTemplate,
  useDisableQaTemplates,
  useDuplicateQaTemplate,
  useQaTemplates,
  useUpdateQaTemplate,
  type QaPromptKind,
  type QaPromptTemplate,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { toast } from "@noalhub/ui/toast";
import { MarkdownEditor, type Editor } from "@noalhub/ui/blog/markdown-editor";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Dialog } from "@noalhub/ui/dialog";
import { DropdownMenu, DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Switch } from "@noalhub/ui/switch";
import {
  TableBody,
  TableBulkAction,
  TableBulkBar,
  TableCell,
  TableActionsHeaderCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
  TableSortHeaderCell,
  type SortDirection,
} from "@noalhub/ui/table";
import { TablePagination } from "@noalhub/ui/table-pagination";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";

const COLUMN_COUNT = 7;
const PAGE_SIZES = [10, 25, 50] as const;

type SortKey = "name" | "kind" | "key" | "defaults" | "enabled";

function compareRows(a: QaPromptTemplate, b: QaPromptTemplate, by: SortKey): number {
  if (by === "enabled") return Number(a.enabled) - Number(b.enabled);
  if (by === "defaults") return (a.defaults?.count ?? 0) - (b.defaults?.count ?? 0);
  return a[by].localeCompare(b[by]);
}

/**
 * The prompts the two generate stages run on.
 *
 * The table is **empty after a fresh migration and that is the correct state** —
 * the backend seeds nothing. A prompt is user data, and user data in a migration
 * is data that `down` cannot put back the way it was; on top of that, a prompt
 * that suits every textbook is a prompt nobody has tried.
 */
export function QaTemplatesContent() {
  const t = useTranslations("admin.qa");
  const [kind, setKind] = useState<QaPromptKind | "">("");
  const templates = useQaTemplates(kind === "" ? undefined : kind);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<QaPromptTemplate | null>(null);
  const [duplicating, setDuplicating] = useState<QaPromptTemplate | null>(null);

  // The list is not paginated by the server — every prompt is already here —
  // so sorting and paging on the client is exact, not one page lying about the rest.
  const [sort, setSort] = useState<{ by: SortKey; dir: "asc" | "desc" } | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);

  const data = templates.data;
  const sorted = useMemo(() => {
    const all = data ?? [];
    // No column picked: newest first by creation date. `updatedAt` stands in
    // until the backend sends `createdAt`.
    if (!sort) {
      const created = (row: QaPromptTemplate) => row.createdAt ?? row.updatedAt;
      return [...all].sort((a, b) => created(b).localeCompare(created(a)));
    }
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...all].sort((a, b) => factor * compareRows(a, b, sort.by));
  }, [data, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const directionOf = (by: SortKey): SortDirection => (sort?.by === by ? sort.dir : false);
  // asc → desc → off, the cycle `TableSortHeaderCell` documents.
  const toggleSort = (by: SortKey) => {
    setPage(1);
    setSort((current) =>
      current?.by !== by ? { by, dir: "asc" } : current.dir === "asc" ? { by, dir: "desc" } : null,
    );
  };
  const sortHeader = (by: SortKey, label: string) => (
    <TableSortHeaderCell
      direction={directionOf(by)}
      onToggle={() => toggleSort(by)}
      sortHint={t("templates.sortHint", { column: label })}
    >
      {label}
    </TableSortHeaderCell>
  );

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  // Derived from the current list, so a row that vanished after a refetch or a
  // filter change cannot stay "selected" invisibly and get disabled anyway.
  const selectedIds = rows.filter((row) => selected.has(row.id)).map((row) => row.id);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const toggleRow = (id: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set());

  return (
    <main className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-160 flex-col gap-1">
          <Typography variant="h4" as="h1">
            {t("templates.title")}
          </Typography>
          <Typography variant="body-3" className="text-muted-foreground">
            {t("templates.intro")}
          </Typography>
        </div>
        <Button onClick={() => setCreating(true)}>{t("templates.add")}</Button>
      </div>

      <div className="w-80 max-w-full">
        <Select
          label={t("templates.filterKind")}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as QaPromptKind | "");
            setSelected(new Set());
          }}
          placeholder={t("templates.allKinds")}
          options={[
            { value: "outline", label: t("templates.kinds.outline") },
            { value: "qa", label: t("templates.kinds.qa") },
          ]}
        />
      </div>

      {templates.isError ? (
        <AdminErrorState
          error={templates.error}
          onRetry={() => templates.refetch()}
        />
      ) : (
        <div>
          <TableRoot
            caption={t("templates.caption")}
            footer={
              sorted.length > 0 ? (
                <TablePagination
                  summary={t("templates.footer", {
                    from: (currentPage - 1) * pageSize + 1,
                    to: Math.min(currentPage * pageSize, sorted.length),
                    total: sorted.length,
                  })}
                  page={currentPage}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  pageSizes={PAGE_SIZES}
                  perPageLabel={t("templates.perPageLabel")}
                  formatPageSize={(size) => t("templates.perPage", { count: size })}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              ) : undefined
            }
          >
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-10">
                  <Checkbox
                    size="sm"
                    aria-label={t("templates.selectAll")}
                    disabled={rows.length === 0}
                    checked={allSelected ? true : selectedIds.length > 0 ? "indeterminate" : false}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                  />
                </TableHeaderCell>
                {sortHeader("name", t("templates.columns.name"))}
                {sortHeader("kind", t("templates.columns.kind"))}
                {sortHeader("key", t("templates.columns.key"))}
                {sortHeader("defaults", t("templates.columns.defaults"))}
                {sortHeader("enabled", t("templates.columns.enabled"))}
                <TableActionsHeaderCell label={t("actionsColumn")} />
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t("templates.empty")}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <TemplateRow
                    key={row.id}
                    row={row}
                    selected={selected.has(row.id)}
                    onSelect={(checked) => toggleRow(row.id, checked)}
                    onEdit={() => setEditing(row)}
                    onDuplicate={() => setDuplicating(row)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {selectedIds.length > 0 ? (
        <TableBulkBar
          className="sticky bottom-4 mx-auto"
          label={t("templates.selected", { count: selectedIds.length })}
          toolbarLabel={t("templates.bulkActions")}
        >
          <TableBulkAction
            label={t("templates.clearSelection")}
            icon={ICONS.close}
            onClick={() => setSelected(new Set())}
          />
          <TableBulkAction
            label={t("templates.disableSelected")}
            icon={ICONS.delete}
            variant="danger"
            onClick={() => setConfirmingBulk(true)}
          />
        </TableBulkBar>
      ) : null}

      {confirmingBulk ? (
        <BulkDisableDialog
          ids={selectedIds}
          onDone={(failed) => {
            setSelected(new Set(failed));
            if (failed.length === 0) setConfirmingBulk(false);
          }}
          onClose={() => setConfirmingBulk(false)}
        />
      ) : null}
      {creating ? <TemplateDialog onClose={() => setCreating(false)} /> : null}
      {editing ? (
        <TemplateDialog row={editing} onClose={() => setEditing(null)} />
      ) : null}
      {duplicating ? (
        <DuplicateDialog
          row={duplicating}
          onClose={() => setDuplicating(null)}
        />
      ) : null}
    </main>
  );
}

function TemplateRow({
  row,
  selected,
  onSelect,
  onEdit,
  onDuplicate,
}: {
  row: QaPromptTemplate;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const t = useTranslations("admin.qa");
  const update = useUpdateQaTemplate(row.id);

  return (
    <TableRow onActivate={onEdit} aria-selected={selected}>
      {/* Stops here so ticking a row does not also open its edit dialog. */}
      <TableCell
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Checkbox
          size="sm"
          aria-label={t("templates.selectRow", { name: row.name })}
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
        />
      </TableCell>
      <TableCell>
        {row.name}
      </TableCell>
      <TableCell>
        <Badge tone={row.kind === "qa" ? "info" : "neutral"}>
          {t(`templates.kinds.${row.kind}`)}
        </Badge>
      </TableCell>
      <TableCell className="break-all">{row.key}</TableCell>
      <TableCell>
        {row.defaults?.count
          ? t("templates.defaultCount", { count: row.defaults.count })
          : "—"}
      </TableCell>
      {/* Stops here so flipping the switch does not also open the edit dialog. */}
      <TableCell
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Switch
          aria-label={t("templates.toggleRow", { name: row.name })}
          checked={row.enabled}
          loading={update.isPending}
          onCheckedChange={(enabled) =>
            update.mutate(
              { enabled },
              {
                onSuccess: () => toast.success(t("templates.saved")),
                onError: () => toast.error(t("templates.saveFailed")),
              },
            )
          }
        />
      </TableCell>
      <TableRowActions label={t("actionsColumn")}>
        <DropdownMenuItem icon={ICONS.edit} onSelect={onEdit}>
          {t("templates.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem icon={ICONS.copy} onSelect={onDuplicate}>
          {t("templates.duplicate")}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  );
}

function BulkDisableDialog({
  ids,
  onDone,
  onClose,
}: {
  ids: string[];
  onDone: (failed: string[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const disable = useDisableQaTemplates();
  const [failedCount, setFailedCount] = useState(0);

  const confirm = async () => {
    const failed = await disable.mutateAsync(ids);
    onDone(failed);
    // Stay open on a partial failure so the count is read, not silently lost.
    if (failed.length > 0) setFailedCount(failed.length);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("templates.disableSelectedTitle", { count: ids.length })}
    >
      <div className="space-y-4">
        <Typography variant="body-3" className="opacity-70">
          {t("templates.disableSelectedIntro")}
        </Typography>
        {failedCount > 0 ? (
          <AlertError message={t("templates.disableSelectedFailed", { count: failedCount })} />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={disable.isPending}
            onClick={() => void confirm()}
          >
            {t("templates.disableSelected")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * One dialog for both create and edit. `kind` and `key` are read-only once the
 * row exists: `qa_generations.template_id` points at it, and changing `key`
 * changes the shape every item already generated was written against.
 */
function TemplateDialog({
  row,
  onClose,
}: {
  row?: QaPromptTemplate;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const create = useCreateQaTemplate();
  const update = useUpdateQaTemplate(row?.id ?? "");
  const editorRef = useRef<Editor | null>(null);
  const setEditor = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  const [kind, setKind] = useState<QaPromptKind>(row?.kind ?? "outline");
  const [key, setKey] = useState(row?.key ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [prompt, setPrompt] = useState(row?.prompt ?? "");
  const [formError, setFormError] = useState<Message | string | null>(null);
  // The prompt is the one long field in this form; full screen gives it room.
  // Entering or leaving remounts the editor, which reads `prompt` on mount, so
  // nothing typed is lost.
  const [fullscreen, setFullscreen] = useState(false);

  // Checked as they type, not on submit: being refused after composing a long
  // prompt is the worst moment to learn the rule.
  const sourceVariables = findSourceVariables(prompt);

  // The editor owns the caret and selection, so the token goes in through it —
  // `onChange` then writes the serialized markdown back into `prompt`.
  const insertVariable = (variable: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.chain().focus().insertContent(`{{${variable}}}`).run();
  };

  const save = async () => {
    setFormError(null);
    try {
      if (row) {
        await update.mutateAsync({ name, prompt });
        toast.success(t("templates.saved"));
      } else if (kind === "qa") {
        // No key: the server derives one from the name — it no longer names a shape.
        await create.mutateAsync({ kind, name, prompt });
        toast.success(t("templates.created"));
      } else {
        await create.mutateAsync({ kind, key, name, prompt });
        toast.success(t("templates.created"));
      }
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  // Lives in the editor's toolbar: the tokens go into the text, so the control
  // belongs next to it rather than a form field away.
  const variablesMenu = (
    <DropdownMenu
      compact
      trigger={
        <Button variant="outline" size="xs">
          <Icon icon={LUCIDE.braces} className="size-3.5" />
          {t("templates.fields.insertVariable")}
        </Button>
      }
    >
      {PROMPT_VARIABLES.map((variable) => (
        <DropdownMenuItem key={variable} onSelect={() => insertVariable(variable)}>
          {`{{${variable}}}`}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );

  const variablesHint = (
    <Typography variant="body-4" className="text-muted-foreground">
      {t("templates.fields.variablesHint", {
        forbidden: FORBIDDEN_PROMPT_VARIABLES.map((v) => `{{${v}}}`).join(", "),
      })}
    </Typography>
  );

  const canSave =
    sourceVariables.length === 0 &&
    prompt.trim() !== "" &&
    (kind === "qa" || row !== undefined || key.trim() !== "");

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={
        row
          ? t("templates.editTitle", { name: row.name })
          : t("templates.addTitle")
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("templates.fields.kind")}
            value={kind}
            disabled={Boolean(row)}
            onChange={(event) => setKind(event.target.value as QaPromptKind)}
            options={[
              { value: "outline", label: t("templates.kinds.outline") },
              { value: "qa", label: t("templates.kinds.qa") },
            ]}
          />
          {kind === "outline" ? (
            <Input
              label={t("templates.fields.key")}
              value={key}
              disabled={Boolean(row)}
              hint={t("templates.fields.keyHint")}
              onChange={(event) => setKey(event.target.value)}
            />
          ) : null}
        </div>


        <Input
          label={t("templates.fields.name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <Typography variant="title-4" as="span">
            {t("templates.fields.prompt")}
          </Typography>
          {/* Read once on mount, like every editor here — the dialog remounts per row. */}
          {fullscreen ? null : (
            <MarkdownEditor
              value={prompt}
              onChange={setPrompt}
              onReady={setEditor}
              fullscreen={{ active: false, onToggle: () => setFullscreen(true) }}
              toolbarExtra={variablesMenu}
              contentClassName="min-h-40! max-h-60 overflow-y-auto"
            />
          )}
          {variablesHint}
        </div>

        {sourceVariables.length > 0 ? (
          <AlertWarning
            message={t("templates.sourceVariable", {
              variables: sourceVariables.map((v) => `{{${v}}}`).join(", "),
            })}
          />
        ) : null}

        {/* `useMessage` turns the error KEY into text at render time — the api
            layer returns a key so the sentence follows the reader's locale. */}
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={!canSave}
            loading={create.isPending || update.isPending}
          >
            {tc("actions.save")}
          </Button>
        </div>
      </div>

      {fullscreen ? (
        <Dialog
          open
          size="inset"
          hideClose
          title={
            row
              ? t("templates.fields.promptOf", { name: row.name })
              : t("templates.fields.prompt")
          }
          onClose={() => setFullscreen(false)}
        >
          {/* `inset` hands its body no gap of its own, so the stack is spaced here. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex min-h-0 flex-1 flex-col">
              <MarkdownEditor
                value={prompt}
                onChange={setPrompt}
                onReady={setEditor}
                fullscreen={{ active: true, onToggle: () => setFullscreen(false) }}
                toolbarExtra={variablesMenu}
                contentClassName="h-full overflow-y-auto"
              />
            </div>
            {variablesHint}
            <Typography variant="body-4" className="text-right text-muted-foreground tabular-nums">
              {t("templates.fields.characters", { count: prompt.length })}
            </Typography>
          </div>
        </Dialog>
      ) : null}
    </Dialog>
  );
}

/**
 * Asks for what a copy cannot inherit. An outline prompt's `key` is unique within
 * its kind and cannot be edited afterwards, so it is asked for here (we suggest
 * `<key>_copy`). A `qa` prompt has no key to choose — the server derives one — so a
 * copy only needs a new name and carries the same shapes.
 */
function DuplicateDialog({
  row,
  onClose,
}: {
  row: QaPromptTemplate;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const duplicate = useDuplicateQaTemplate();

  const [name, setName] = useState(
    t("templates.copySuffix", { name: row.name }),
  );
  const [key, setKey] = useState(`${row.key}_copy`);
  const [formError, setFormError] = useState<Message | string | null>(null);

  const save = async () => {
    setFormError(null);
    try {
      await duplicate.mutateAsync({
        id: row.id,
        input: row.kind === "qa" ? { name } : { key, name },
      });
      toast.success(t("templates.duplicated"));
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  const canSave =
    name.trim() !== "" &&
    (row.kind === "qa" || key.trim() !== "");

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("templates.duplicateTitle", { name: row.name })}
    >
      <div className="space-y-4">
        <Typography variant="body-3" className="opacity-70">
          {t("templates.duplicateIntro")}
        </Typography>

        <Input
          label={t("templates.fields.name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        {row.kind === "outline" ? (
          <Input
            label={t("templates.fields.key")}
            value={key}
            hint={t("templates.fields.keyHint")}
            onChange={(event) => setKey(event.target.value)}
          />
        ) : null}

        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={!canSave}
            loading={duplicate.isPending}
          >
            {t("templates.duplicate")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          {Array.from({ length: COLUMN_COUNT }).map((_, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
