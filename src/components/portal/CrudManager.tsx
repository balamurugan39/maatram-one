import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, Field, Loading, selectClass } from "./ui";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
// Generic table access: the table name is a runtime value here, so the typed client is widened.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "datetime" | "select" | "checkbox" | "email";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;
};

export type ColumnDef = { key: string; label: string; render?: (row: Row) => ReactNode; className?: string };

function toInput(v: unknown, type?: FieldDef["type"]) {
  if (v === null || v === undefined) return type === "checkbox" ? false : "";
  if (type === "datetime" && typeof v === "string") {
    const d = new Date(v);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return v;
}

function fromInput(v: unknown, type?: FieldDef["type"]) {
  if (type === "checkbox") return !!v;
  if (v === "" || v === undefined) return null;
  if (type === "number") return Number(v);
  if (type === "datetime") return new Date(String(v)).toISOString();
  return v;
}

export function CrudManager({
  table,
  title,
  fields,
  columns,
  orderBy = "created_at",
  ascending = false,
  select = "*",
  defaults = {},
  rowActions,
  searchKeys = [],
  addLabel = "Add",
  emptyHint,
  canDelete = true,
  filter,
  toolbar,
  canAdd = true,
  canEdit = true,
  idKey = "id",
}: {
  table: string;
  title: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  orderBy?: string;
  ascending?: boolean;
  select?: string;
  defaults?: Row;
  rowActions?: (row: Row) => ReactNode;
  searchKeys?: string[];
  addLabel?: string;
  emptyHint?: string;
  canDelete?: boolean;
  filter?: (row: Row) => boolean;
  toolbar?: ReactNode;
  canAdd?: boolean;
  canEdit?: boolean;
  idKey?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Row>({});
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [table, select, orderBy],
    queryFn: async () => {
      const { data, error } = await db.from(table).select(select).order(orderBy, { ascending });
      if (error) throw error;
      return data as Row[];
    },
  });

  const rows = useMemo(() => {
    let r = data ?? [];
    if (filter) r = r.filter(filter);
    if (q && searchKeys.length) {
      const s = q.toLowerCase();
      r = r.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(s)));
    }
    return r;
  }, [data, q, searchKeys, filter]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = { ...defaults };
      for (const f of fields) payload[f.name] = fromInput(values[f.name], f.type);
      const res = editing
        ? await db.from(table).update(payload).eq(idKey, editing[idKey])
        : await db.from(table).insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Saved" : "Added");
      setOpen(false);
      qc.invalidateQueries({ queryKey: [table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq(idKey, id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: [table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(row: Row | null) {
    setEditing(row);
    const v: Row = {};
    for (const f of fields) v[f.name] = toInput(row ? row[f.name] : (defaults[f.name] ?? (f.type === "checkbox" ? false : "")), f.type);
    setValues(v);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {searchKeys.length > 0 && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="bg-card pl-8" />
            </div>
          )}
          {toolbar}
        </div>
        {canAdd && (
          <Button onClick={() => startEdit(null)}>
            <Plus /> {addLabel}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        {isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <div className="p-4"><Empty title={`No ${title.toLowerCase()} yet`} hint={emptyHint} /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map((c) => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row[idKey] ?? JSON.stringify(row)}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>{c.render ? c.render(row) : (row[c.key] ?? "—")}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {rowActions?.(row)}
                        {canEdit && fields.length > 0 && (
                          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => startEdit(row)}><Pencil /></Button>
                        )}
                        {canDelete && (
                          <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm("Delete this record?")) del.mutate(row[idKey]); }}>
                            <Trash2 className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? `Edit ${title.replace(/s$/, "")}` : addLabel}</DialogTitle></DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          >
            {fields.map((f) => (
              <Field key={f.name} label={f.label} required={f.required} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                {f.type === "textarea" ? (
                  <Textarea value={values[f.name] ?? ""} required={f.required} placeholder={f.placeholder} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                ) : f.type === "select" ? (
                  <select className={selectClass} value={values[f.name] ?? ""} required={f.required} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                    <option value="">Select…</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "checkbox" ? (
                  <label className="flex h-9 items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.checked })} className="size-4 accent-primary" />
                    Yes
                  </label>
                ) : (
                  <Input
                    type={f.type === "datetime" ? "datetime-local" : f.type ?? "text"}
                    step={f.type === "number" ? "any" : undefined}
                    value={values[f.name] ?? ""}
                    required={f.required}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  />
                )}
              </Field>
            ))}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
