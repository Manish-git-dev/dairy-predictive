import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import workflowService from "../../services/workflowService";

const STATUS_OPTIONS = ["draft", "pending", "in_progress", "blocked", "completed", "cancelled"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];
const EMPTY_FORM = {
  name: "",
  description: "",
  priority: "medium",
  status: "draft",
  owner: "",
  assignedUsers: [],
  slaMinutes: "",
  startTime: "",
  dueTime: "",
  relatedOperation: "",
  notes: "",
};

const labelize = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};
const inputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.slate}`}>{children}</span>;
}

function toneForPriority(priority) {
  return priority === "critical" ? "red" : priority === "high" ? "amber" : priority === "medium" ? "blue" : "slate";
}

function getSla(workflow) {
  if (!workflow?.dueTime || ["completed", "cancelled"].includes(workflow.status)) return { label: workflow?.status === "completed" ? "Completed" : "No due time", tone: "slate" };
  const due = new Date(workflow.dueTime);
  if (Number.isNaN(due.getTime())) return { label: "SLA unavailable", tone: "slate" };
  const diff = due.getTime() - Date.now();
  if (workflow.sla?.breached || diff < 0) return { label: "Breached", tone: "red" };
  if (diff < 2 * 60 * 60 * 1000) return { label: "At risk", tone: "amber" };
  return { label: "On track", tone: "green" };
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true">
    <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">×</button>
      </div>
      {children}
    </div>
  </div>;
}

function Field({ label, children, className = "" }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

function WorkflowForm({ form, setForm, users, saving, onSubmit, onClose, editing }) {
  const toggleUser = (id) => setForm((current) => ({ ...current, assignedUsers: current.assignedUsers.includes(id) ? current.assignedUsers.filter((x) => x !== id) : [...current.assignedUsers, id] }));
  return <form onSubmit={onSubmit} className="space-y-5 p-5">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Workflow name *" className="sm:col-span-2"><input required maxLength={160} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning collection exception review" /></Field>
      <Field label="Description" className="sm:col-span-2"><textarea rows={3} maxLength={2000} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Priority"><select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITY_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Status"><select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUS_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Owner *"><select required className={inputClass} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}><option value="">Select owner</option>{users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} · {labelize(user.role)}</option>)}</select></Field>
      <Field label="SLA (minutes)"><input min="1" type="number" className={inputClass} value={form.slaMinutes} onChange={(e) => setForm({ ...form, slaMinutes: e.target.value })} placeholder="Optional" /></Field>
      <Field label="Start time"><input type="datetime-local" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
      <Field label="Due time"><input type="datetime-local" className={inputClass} value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} /></Field>
      <Field label="Related operation"><input maxLength={160} className={inputClass} value={form.relatedOperation} onChange={(e) => setForm({ ...form, relatedOperation: e.target.value })} placeholder="Collection / chilling / processing..." /></Field>
      <Field label="Assigned users" className="sm:col-span-2"><div className="grid max-h-36 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">{users.length ? users.map((user) => <label key={user._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"><input type="checkbox" checked={form.assignedUsers.includes(user._id)} onChange={() => toggleUser(user._id)} /><span className="text-sm text-slate-700">{user.firstName} {user.lastName}</span></label>) : <p className="text-sm text-slate-500">No active users available.</p>}</div></Field>
      <Field label="Notes" className="sm:col-span-2"><textarea rows={4} maxLength={4000} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
    </div>
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Create workflow"}</button></div>
  </form>;
}

export default function WorkflowQueuesPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", owner: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async (nextPage = page) => {
    setLoading(true); setError("");
    try {
      const result = await workflowService.list({ ...filters, page: nextPage, limit: 20 });
      setItems(Array.isArray(result.data?.items) ? result.data.items : Array.isArray(result.items) ? result.items : []);
      setTotalPages(Number(result.data?.totalPages ?? result.totalPages ?? 1) || 1);
      setPage(nextPage);
    } catch (err) { setError(err.response?.data?.message || err.message || "Unable to load workflows"); }
    finally { setLoading(false); }
  };

  useEffect(() => { workflowService.getUsers().then((result) => setUsers(Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : [])).catch(() => setUsers([])); }, []);
  useEffect(() => { const timer = setTimeout(() => load(1), 250); return () => clearTimeout(timer); }, [filters.search, filters.status, filters.priority, filters.owner]);

  const openCreate = () => { setForm({ ...EMPTY_FORM, owner: users[0]?._id || "" }); setModal("create"); };
  const openEdit = (workflow) => {
    setForm({ name: workflow.name || "", description: workflow.description || "", priority: workflow.priority || "medium", status: workflow.status || "draft", owner: workflow.owner?._id || workflow.owner || "", assignedUsers: (workflow.assignedUsers || []).map((x) => x._id || x), slaMinutes: workflow.sla?.minutes || "", startTime: inputDate(workflow.startTime), dueTime: inputDate(workflow.dueTime), relatedOperation: workflow.relatedOperation || "", notes: workflow.notes || "" });
    setSelected(workflow); setModal("edit");
  };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const payload = { ...form, slaMinutes: form.slaMinutes || undefined, startTime: form.startTime || undefined, dueTime: form.dueTime || undefined };
    try {
      const result = modal === "edit" ? await workflowService.update(selected._id, payload) : await workflowService.create(payload);
      const workflow = result.data || result;
      setModal(null); setSelected(null);
      if (modal === "edit") setItems((current) => current.map((item) => item._id === workflow._id ? workflow : item));
      else setItems((current) => [workflow, ...current]);
    } catch (err) { setError(err.response?.data?.message || err.message || "Unable to save workflow"); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try { await workflowService.remove(deleteTarget._id); setItems((current) => current.filter((item) => item._id !== deleteTarget._id)); setDeleteTarget(null); }
    catch (err) { setError(err.response?.data?.message || err.message || "Unable to delete workflow"); }
    finally { setSaving(false); }
  };

  const transition = async (workflow, status) => {
    try {
      const result = await workflowService.transition(workflow._id, status);
      const updated = result.data || result;
      setItems((current) => current.map((item) => item._id === updated._id ? updated : item));
      if (selected?._id === updated._id) setSelected(updated);
    } catch (err) { setError(err.response?.data?.message || err.message || "Unable to change workflow status"); }
  };

  const ownerOptions = useMemo(() => users, [users]);

  return <div className="space-y-6 pb-8">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Workflow Management</h1><p className="mt-1 text-sm text-slate-500">Create, assign, execute and track operational workflows backed by MongoDB.</p></div><button type="button" onClick={openCreate} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">+ Create workflow</button></div>

    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}<button type="button" className="ml-3 font-semibold underline" onClick={() => setError("")}>Dismiss</button></div>}

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"><input className={inputClass} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search workflows…" aria-label="Search workflows" /><select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{STATUS_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select><select className={inputClass} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{PRIORITY_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select><select className={inputClass} value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}><option value="">All owners</option>{ownerOptions.map((x) => <option key={x._id} value={x._id}>{x.firstName} {x.lastName}</option>)}</select><button type="button" onClick={() => setFilters({ search: "", status: "", priority: "", owner: "" })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Clear filters</button></div></div>

    {loading ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{[1,2,3,4].map((x) => <div key={x} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}</div> : !items.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center"><p className="text-base font-semibold text-slate-800">No workflows found</p><p className="mt-1 text-sm text-slate-500">Create a workflow or adjust the filters to see operational work.</p><button type="button" onClick={openCreate} className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Create workflow</button></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Workflow</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">SLA</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((workflow) => { const sla = getSla(workflow); return <tr key={workflow._id} className="hover:bg-slate-50"><td className="px-5 py-4"><button type="button" onClick={() => setSelected(workflow)} className="text-left"><p className="font-semibold text-slate-900 hover:text-primary-700">{workflow.name}</p><p className="mt-1 max-w-xs truncate text-xs text-slate-500">{workflow.relatedOperation || workflow.workflowId}</p></button></td><td className="px-4 py-4"><Badge tone={toneForPriority(workflow.priority)}>{labelize(workflow.priority)}</Badge></td><td className="px-4 py-4"><select value={workflow.status} onChange={(e) => transition(workflow, e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"><option value={workflow.status}>{labelize(workflow.status)}</option>{STATUS_OPTIONS.filter((x) => x !== workflow.status).map((x) => <option key={x}>{x}</option>)}</select></td><td className="px-4 py-4 text-sm text-slate-700">{workflow.owner ? `${workflow.owner.firstName || ""} ${workflow.owner.lastName || ""}`.trim() || "—" : "—"}</td><td className="px-4 py-4"><Badge tone={sla.tone}>{sla.label}</Badge></td><td className="px-4 py-4 text-xs text-slate-500">{formatDate(workflow.dueTime)}</td><td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => setSelected(workflow)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700">View</button><button type="button" onClick={() => openEdit(workflow)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Edit</button><button type="button" onClick={() => setDeleteTarget(workflow)} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700">Delete</button></div></td></tr>; })}</tbody></table></div></div>}

    {totalPages > 1 && <div className="flex items-center justify-between"><button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => load(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button></div>}

    {modal && <Modal wide title={modal === "edit" ? "Edit workflow" : "Create workflow"} onClose={() => setModal(null)}><WorkflowForm form={form} setForm={setForm} users={users} saving={saving} onSubmit={submit} onClose={() => setModal(null)} editing={modal === "edit"} /></Modal>}

    {selected && !modal && <Modal title="Workflow details" onClose={() => setSelected(null)}><div className="space-y-5 p-5"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-slate-950">{selected.name}</h2><Badge tone={toneForPriority(selected.priority)}>{labelize(selected.priority)}</Badge><Badge tone={selected.status === "completed" ? "green" : selected.status === "blocked" ? "red" : "blue"}>{labelize(selected.status)}</Badge></div><p className="mt-2 text-sm text-slate-500">{selected.description || "No description provided."}</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold text-slate-500">Owner</p><p className="mt-1 text-sm text-slate-800">{selected.owner ? `${selected.owner.firstName || ""} ${selected.owner.lastName || ""}`.trim() : "—"}</p></div><div><p className="text-xs font-semibold text-slate-500">Related operation</p><p className="mt-1 text-sm text-slate-800">{selected.relatedOperation || "—"}</p></div><div><p className="text-xs font-semibold text-slate-500">Start time</p><p className="mt-1 text-sm text-slate-800">{formatDate(selected.startTime)}</p></div><div><p className="text-xs font-semibold text-slate-500">Due time</p><p className="mt-1 text-sm text-slate-800">{formatDate(selected.dueTime)}</p></div><div><p className="text-xs font-semibold text-slate-500">SLA</p><p className="mt-1"><Badge tone={getSla(selected).tone}>{getSla(selected).label}{selected.sla?.minutes ? ` · ${selected.sla.minutes} min` : ""}</Badge></p></div><div><p className="text-xs font-semibold text-slate-500">Assigned users</p><p className="mt-1 text-sm text-slate-800">{selected.assignedUsers?.length ? selected.assignedUsers.map((u) => `${u.firstName || ""} ${u.lastName || ""}`.trim()).join(", ") : "None"}</p></div></div><div><p className="text-xs font-semibold text-slate-500">Notes</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{selected.notes || "No notes."}</p></div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => openEdit(selected)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Edit</button><Link to="/tasks" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Open tasks</Link><button type="button" onClick={() => setSelected(null)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Close</button></div></div></Modal>}

    {deleteTarget && <Modal title="Delete workflow" onClose={() => !saving && setDeleteTarget(null)}><div className="space-y-5 p-5"><p className="text-sm text-slate-600">Delete <strong>{deleteTarget.name}</strong>? This permanently removes the workflow from MongoDB and cannot be undone.</p><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" disabled={saving} onClick={remove} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Deleting…" : "Delete workflow"}</button></div></div></Modal>}
  </div>;
}
