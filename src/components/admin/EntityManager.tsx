"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Feedback";
import { errorMessage, isApiClientError } from "@/lib/api-client";
import { ConfirmInline } from "./ConfirmInline";
import { Drawer } from "./Drawer";
import { EntityForm, type FieldDef, type FormValues } from "./EntityForm";
import { ActiveBadge } from "./StatusBadge";
import { useToast } from "./Toast";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T extends { id: string; isActive?: boolean }> {
  noun: string;
  rows: T[];
  columns: Column<T>[];
  fields: FieldDef[];
  emptyValues: () => FormValues;
  toValues: (row: T) => FormValues;
  /** Convert form values to the API body (coerce numbers, drop helper fields…). */
  toBody: (v: FormValues, editing: T | null) => Record<string, unknown>;
  create: (body: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, body: Record<string, unknown>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  /** Optional client-side validation before calling the API. */
  validate?: (v: FormValues) => Record<string, string>;
  description?: React.ReactNode;
  headerExtra?: React.ReactNode;
  drawerNote?: React.ReactNode;
  emptyText?: string;
}

/** Table + drawer CRUD used by catalogue, faculty and community screens. */
export function EntityManager<T extends { id: string; isActive?: boolean }>(props: Props<T>) {
  const { noun, rows, columns, fields, emptyValues, toValues, toBody, create, update, remove, validate } = props;
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState<T | null>(null);
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<FormValues>(emptyValues);
  const [initial, setInitial] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [toggling, setToggling] = React.useState<string | null>(null);

  const openNew = () => {
    const v = emptyValues();
    setEditing(null);
    setValues(v);
    setInitial(JSON.stringify(v));
    setErrors({});
    setFormError(null);
    setSlugTouched(false);
    setOpen(true);
  };
  const openEdit = (row: T) => {
    const v = toValues(row);
    setEditing(row);
    setValues(v);
    setInitial(JSON.stringify(v));
    setErrors({});
    setFormError(null);
    setSlugTouched(true);
    setOpen(true);
  };
  const dirty = JSON.stringify(values) !== initial;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs = validate?.(values) ?? {};
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setFormError(null);
    try {
      const body = toBody(values, editing);
      if (editing) await update(editing.id, body);
      else await create(body);
      toast.success(editing ? `${noun} updated` : `${noun} added`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (isApiClientError(err) && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    setDeleting(true);
    try {
      await remove(id);
      toast.success(`${noun} deleted`);
      setConfirmId(null);
      router.refresh();
    } catch (err) {
      toast.error(`Couldn't delete`, errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (row: T) => {
    setToggling(row.id);
    try {
      await update(row.id, { isActive: !row.isActive });
      router.refresh();
    } catch (err) {
      toast.error("Couldn't update", errorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-text-3">{props.description}</div>
        <div className="flex flex-wrap gap-2">
          {props.headerExtra}
          <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Add {noun.toLowerCase()}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState compact title={`No ${noun.toLowerCase()} entries yet`} description={props.emptyText} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-bg-2 text-xs uppercase tracking-wider text-text-3">
              <tr>
                {columns.map((c) => (
                  <th key={c.header} scope="col" className={`px-4 py-3 font-semibold ${c.className ?? ""}`}>
                    {c.header}
                  </th>
                ))}
                {rows[0]?.isActive !== undefined && <th scope="col" className="px-4 py-3 font-semibold">Status</th>}
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface/50">
              {rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="align-top">
                    {columns.map((c) => (
                      <td key={c.header} className={`px-4 py-3 text-text-2 ${c.className ?? ""}`}>
                        {c.cell(row)}
                      </td>
                    ))}
                    {row.isActive !== undefined && (
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => void toggleActive(row)} disabled={toggling === row.id} title="Toggle visibility" className="disabled:opacity-50">
                          <ActiveBadge active={Boolean(row.isActive)} />
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)} leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden />}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirmId(row.id)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {confirmId === row.id && (
                    <tr>
                      <td colSpan={columns.length + 2} className="px-4 pb-3">
                        <ConfirmInline message={`Delete this ${noun.toLowerCase()}? This can't be undone.`} confirmLabel="Delete" loading={deleting} onConfirm={() => doDelete(row.id)} onCancel={() => setConfirmId(null)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        closeGuard={() => !dirty || saving ? !saving : (typeof window !== "undefined" && window.confirm("Discard unsaved changes?"))}
        title={editing ? `Edit ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} loading={saving}>
              {editing ? "Save changes" : `Add ${noun.toLowerCase()}`}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          {props.drawerNote}
          {formError && <Alert variant="danger">{formError}</Alert>}
          <EntityForm fields={fields} values={values} onChange={setValues} errors={errors} disabled={saving} slugTouched={slugTouched} onSlugTouched={() => setSlugTouched(true)} />
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Drawer>
    </div>
  );
}
