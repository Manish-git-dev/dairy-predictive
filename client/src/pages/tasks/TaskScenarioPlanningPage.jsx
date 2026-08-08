import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import taskService from '../../services/taskService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUSES = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const EMPTY_FORM = {
  title: '', description: '', type: 'operational', priority: 'medium', status: 'pending',
  assignedTo: '', dueDate: ''
};

const label = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const fullName = (u) => u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : 'Unassigned';
const progressFor = (status) => ({ pending: 0, in_progress: 50, blocked: 50, completed: 100, cancelled: 100 }[status] ?? 0);

function dueState(task) {
  if (!task.dueDate || ['completed', 'cancelled'].includes(task.status)) return null;
  const due = new Date(task.dueDate).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  if (due - now <= 48 * 60 * 60 * 1000) return 'soon';
  return null;
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={onClose}>
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ title, children }) {
  return <label className="space-y-1 text-sm"><span className="font-medium text-slate-700">{title}</span>{children}</label>;
}

export default function TaskScenarioPlanningPage() {
  const { user } = useContext(AuthContext);
  const canManage = ['ops_admin', 'manager'].includes(user?.role);
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', assignedTo: '', sortBy: 'createdAt', sortOrder: 'desc', page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [comment, setComment] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await taskService.getAllTasks(filters);
      const data = response.data || response;
      setTasks(data.items || []);
      setMeta({ total: data.total || 0, page: data.page || 1, totalPages: data.totalPages || 1, limit: data.limit || 10 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load tasks.');
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => {
    taskService.getAssignees().then((r) => setAssignees(r.data || r || [])).catch(() => setAssignees([]));
  }, []);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title || '', description: task.description || '', type: task.type || 'operational',
      priority: task.priority || 'medium', status: task.status || 'pending', assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null };
    try {
      if (editingId) await taskService.updateTask(editingId, payload);
      else await taskService.createTask(payload);
      setShowForm(false); setForm(EMPTY_FORM); await loadTasks();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to save task.'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (task, status) => {
    try { await taskService.updateTaskStatus(task._id, status); await loadTasks(); if (detail?._id === task._id) setDetail(await fetchDetail(task._id)); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Unable to change status.'); }
  };

  const assign = async (task, assigneeId) => {
    try { await taskService.assignTask(task._id, assigneeId || null); await loadTasks(); if (detail?._id === task._id) setDetail(await fetchDetail(task._id)); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Unable to assign task.'); }
  };

  const fetchDetail = async (id) => {
    const response = await taskService.getTaskById(id); return response.data || response;
  };
  const openDetail = async (task) => {
    try { setDetail(await fetchDetail(task._id)); } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to load task details.'); }
  };

  const deleteTask = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try { await taskService.deleteTask(deleteTarget._id); setDeleteTarget(null); if (detail?._id === deleteTarget._id) setDetail(null); await loadTasks(); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Unable to delete task.'); }
    finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!detail || !comment.trim()) return;
    setSaving(true);
    try { await taskService.addNote(detail._id, comment.trim()); setComment(''); setDetail(await fetchDetail(detail._id)); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Unable to add comment.'); }
    finally { setSaving(false); }
  };

  const stats = useMemo(() => ({
    total: meta.total,
    active: tasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length,
    overdue: tasks.filter((t) => dueState(t) === 'overdue').length,
    completed: tasks.filter((t) => t.status === 'completed').length
  }), [tasks, meta.total]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  const sort = (field) => setFilters((f) => ({ ...f, sortBy: field, sortOrder: f.sortBy === field && f.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Task Management</h1><p className="mt-1 text-sm text-slate-500">Manage operational work directly against the database.</p></div>
        {canManage && <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700">+ Create Task</button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[['Total', stats.total], ['Active on page', stats.active], ['Overdue on page', stats.overdue], ['Completed on page', stats.completed]].map(([name, value]) => <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-sm text-slate-500">{name}</div><div className="mt-1 text-2xl font-bold">{value}</div></div>)}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search tasks..." className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 xl:col-span-2" />
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
          <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">All priorities</option>{PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>
          <select value={filters.assignedTo} onChange={(e) => updateFilter('assignedTo', e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">All assignees</option>{assignees.map((u) => <option key={u._id} value={u._id}>{fullName(u)}</option>)}</select>
          <button onClick={() => setFilters((f) => ({ ...f, search: '', status: '', priority: '', assignedTo: '', page: 1 }))} className="rounded-xl border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50">Clear filters</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <LoadingSpinner label="Loading tasks..." /> : tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="text-lg font-semibold">No tasks found</div><p className="mt-1 text-sm text-slate-500">Create a task or change your filters.</p>{canManage && <button onClick={openCreate} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Create first task</button>}</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="min-w-[1100px] w-full"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr>
            <th className="px-4 py-3"><button onClick={() => sort('title')}>Task</button></th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><button onClick={() => sort('priority')}>Priority</button></th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3"><button onClick={() => sort('dueDate')}>Due</button></th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Actions</th>
          </tr></thead><tbody>
            {tasks.map((task) => {
              const due = dueState(task); const progress = progressFor(task.status);
              return <tr key={task._id} className="border-t border-slate-100 align-top hover:bg-slate-50/70">
                <td className="px-4 py-4"><button onClick={() => openDetail(task)} className="text-left font-semibold text-blue-700 hover:underline">{task.title}</button><div className="mt-1 text-xs text-slate-400">{task.taskId} · {label(task.type)}</div></td>
                <td className="px-4 py-4">{canManage || user?.role !== 'analyst' ? <select value={task.status} onChange={(e) => changeStatus(task, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option><option value="cancelled">Cancelled</option></select> : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{label(task.status)}</span>}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${task.priority === 'critical' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-orange-100 text-orange-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>{label(task.priority)}</span></td>
                <td className="px-4 py-4">{canManage ? <select value={task.assignedTo?._id || ''} onChange={(e) => assign(task, e.target.value)} className="max-w-[160px] rounded-lg border border-slate-200 px-2 py-1 text-xs"><option value="">Unassigned</option>{assignees.map((u) => <option key={u._id} value={u._id}>{fullName(u)}</option>)}</select> : <span className="text-sm">{fullName(task.assignedTo)}</span>}</td>
                <td className="px-4 py-4"><div className="text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleString() : '—'}</div>{due === 'overdue' && <span className="text-xs font-semibold text-red-600">Overdue</span>}{due === 'soon' && <span className="text-xs font-semibold text-amber-600">Due soon</span>}</td>
                <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div><span className="text-xs text-slate-500">{progress}%</span></div></td>
                <td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => openDetail(task)} className="rounded-lg border px-2.5 py-1 text-xs">Details</button>{canManage && <><button onClick={() => openEdit(task)} className="rounded-lg border px-2.5 py-1 text-xs">Edit</button><button onClick={() => setDeleteTarget(task)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600">Delete</button></>}</div></td>
              </tr>;
            })}
          </tbody></table></div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500"><span>Showing page {meta.page} of {meta.totalPages} · {meta.total} tasks</span><div className="flex gap-2"><button disabled={meta.page <= 1} onClick={() => updateFilter('page', meta.page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={meta.page >= meta.totalPages} onClick={() => updateFilter('page', meta.page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
        </div>
      )}

      {showForm && <Modal title={editingId ? 'Edit Task' : 'Create Task'} onClose={() => !saving && setShowForm(false)} wide><form onSubmit={submitForm} className="grid gap-4 md:grid-cols-2">
        <Field title="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border px-3 py-2" /></Field>
        <Field title="Type"><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border px-3 py-2" /></Field>
        <Field title="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-24 w-full rounded-xl border px-3 py-2" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field title="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border px-3 py-2">{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field><Field title="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border px-3 py-2">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
        <Field title="Assignee"><select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full rounded-xl border px-3 py-2"><option value="">Unassigned</option>{assignees.map((u) => <option key={u._id} value={u._id}>{fullName(u)} · {u.role}</option>)}</select></Field>
        <Field title="Due date"><input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-xl border px-3 py-2" /></Field>
        <div className="flex justify-end gap-2 md:col-span-2"><button type="button" disabled={saving} onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2">Cancel</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create task'}</button></div>
      </form></Modal>}

      {detail && <Modal title={detail.title} onClose={() => setDetail(null)} wide><div className="space-y-5">
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{detail.taskId}</span><span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">{label(detail.status)}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{label(detail.priority)}</span>{dueState(detail) === 'overdue' && <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">Overdue</span>}{dueState(detail) === 'soon' && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">Due soon</span>}</div>
        <p className="text-sm text-slate-600">{detail.description || 'No description provided.'}</p>
        <div className="grid gap-4 sm:grid-cols-2"><div><div className="text-xs text-slate-400">Assignee</div><div className="font-medium">{fullName(detail.assignedTo)}</div></div><div><div className="text-xs text-slate-400">Due date</div><div className="font-medium">{detail.dueDate ? new Date(detail.dueDate).toLocaleString() : '—'}</div></div><div><div className="text-xs text-slate-400">Created</div><div>{new Date(detail.createdAt).toLocaleString()}</div></div><div><div className="text-xs text-slate-400">Progress</div><div className="mt-1 flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progressFor(detail.status)}%` }} /></div><span>{progressFor(detail.status)}%</span></div></div></div>
        <div><h3 className="mb-2 font-semibold">Comments</h3><div className="space-y-2">{(detail.notes || []).length ? detail.notes.map((n, i) => <div key={n._id || i} className="rounded-xl bg-slate-50 p-3"><div className="text-sm">{n.text}</div><div className="mt-1 text-xs text-slate-400">{fullName(n.author)} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div></div>) : <div className="text-sm text-slate-400">No comments yet.</div>}</div><div className="mt-3 flex gap-2"><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 rounded-xl border px-3 py-2" /><button disabled={saving || !comment.trim()} onClick={addComment} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Comment</button></div></div>
      </div></Modal>}

      {deleteTarget && <Modal title="Delete task?" onClose={() => !saving && setDeleteTarget(null)}><p className="text-sm text-slate-600">This will permanently delete <strong>{deleteTarget.title}</strong> from MongoDB. This action cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button disabled={saving} onClick={() => setDeleteTarget(null)} className="rounded-xl border px-4 py-2">Cancel</button><button disabled={saving} onClick={deleteTask} className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white">{saving ? 'Deleting...' : 'Delete task'}</button></div></Modal>}
    </div>
  );
}
