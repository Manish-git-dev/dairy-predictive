import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import userService from '../../services/userService';
import roleService from '../../services/roleService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ROLES = ['ops_admin', 'manager', 'analyst', 'field_staff'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: 'field_staff',
};

const roleLabel = (role) => role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const statusBadge = (active) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
    {active ? 'Active' : 'Disabled'}
  </span>
);

export default function UserRoleManagementPage() {
  const [tab, setTab] = useState('users');
  const [filters, setFilters] = useState({ page: 1, limit: 10, role: '', isActive: '', search: '' });
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchUsers = useCallback((params) => userService.getAllUsers(params), []);
  const { data, loading, error, refetch } = useFetch(fetchUsers, filters);
  const { data: roleResponse, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useFetch(roleService.getAllRoles, {});

  const users = data?.items || [];
  const totalPages = Math.max(data?.totalPages || 1, 1);
  const roles = roleResponse || [];

  const permissionSummary = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    }));
  }, [roles]);

  useEffect(() => {
    if (filters.page > totalPages) setFilters((current) => ({ ...current, page: totalPages }));
  }, [filters.page, totalPages]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setActionError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'field_staff',
      isActive: user.isActive,
    });
    setActionError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) setShowModal(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setActionError('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.role) {
      setActionError('First name, last name, email and role are required.');
      return;
    }
    if (!editingUser && form.password.length < 8) {
      setActionError('Password must be at least 8 characters and contain uppercase, lowercase and a number.');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role,
        };
        await userService.updateUser(editingUser._id, payload);
      } else {
        await userService.createUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          role: form.role,
        });
      }
      setShowModal(false);
      await refetch(filters);
    } catch (err) {
      setActionError(err?.userMessage || err?.response?.data?.error?.message || 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (user) => {
    if (!window.confirm(`${user.isActive ? 'Disable' : 'Enable'} ${user.email}?`)) return;
    setActionError('');
    try {
      if (user.isActive) await userService.deactivateUser(user._id);
      else await userService.activateUser(user._id);
      await refetch(filters);
    } catch (err) {
      setActionError(err?.userMessage || 'Unable to update user status.');
    }
  };

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  if (loading && !data) return <LoadingSpinner label="Loading administration..." />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Users & roles</h1>
            <p className="mt-1 text-sm text-slate-500">Manage organization users and review the permissions assigned to each role.</p>
          </div>
          {tab === 'users' && (
            <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              + Create user
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-b border-slate-200">
          <button onClick={() => setTab('users')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'users' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Users</button>
          <button onClick={() => setTab('roles')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'roles' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Roles & permissions</button>
        </div>
      </section>

      {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div>}

      {tab === 'users' ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 md:grid-cols-4">
            <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Search name or email" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:col-span-2" />
            <select value={filters.role} onChange={(e) => setFilter('role', e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">All roles</option>
              {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
            </select>
            <select value={filters.isActive} onChange={(e) => setFilter('isActive', e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900">{user.firstName} {user.lastName}</div><div className="text-sm text-slate-500">{user.email}</div></td>
                    <td className="px-5 py-4"><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{roleLabel(user.role)}</span></td>
                    <td className="px-5 py-4">{statusBadge(user.isActive)}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(user)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</button><button onClick={() => toggleUser(user)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{user.isActive ? 'Disable' : 'Enable'}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!users.length && !loading && <div className="p-12 text-center"><p className="font-semibold text-slate-800">No users found</p><p className="mt-1 text-sm text-slate-500">Adjust your filters or create a new organization user.</p></div>}

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
            <span className="text-slate-500">{data?.total || 0} total users</span>
            <div className="flex items-center gap-2"><button disabled={filters.page <= 1} onClick={() => setFilters((c) => ({ ...c, page: c.page - 1 }))} className="rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="px-2 font-medium text-slate-700">Page {filters.page} of {totalPages}</span><button disabled={filters.page >= totalPages} onClick={() => setFilters((c) => ({ ...c, page: c.page + 1 }))} className="rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {rolesLoading && <LoadingSpinner label="Loading roles..." />}
          {rolesError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{rolesError.message}</div>}
          {permissionSummary.map((role) => (
            <article key={role._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">{role.displayName || roleLabel(role.name)}</h2><p className="mt-1 text-sm text-slate-500">{role.description || `Permissions for ${roleLabel(role.name)}.`}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{role.isSystem ? 'System role' : 'Custom role'}</span></div>
              <div className="mt-5 space-y-2">
                {role.permissions.map((permission) => <div key={permission.resource} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"><span className="text-sm font-medium text-slate-700">{permission.resource}</span><div className="flex gap-1">{ACTIONS.map((action) => <span key={action} className={`rounded-md px-2 py-1 text-[11px] font-semibold ${permission.actions?.includes(action) ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-400'}`}>{action}</span>)}</div></div>)}
                {!role.permissions.length && <p className="text-sm text-slate-500">No permissions configured.</p>}
              </div>
            </article>
          ))}
        </section>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={editingUser ? 'Edit user' : 'Create user'}>
          <form onSubmit={handleSave} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">{editingUser ? 'Edit user' : 'Create user'}</h2><p className="mt-1 text-sm text-slate-500">Changes are saved to the organization database.</p></div><button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">First name<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required /></label>
              <label className="text-sm font-medium text-slate-700">Last name<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required /></label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required /></label>
              {!editingUser && <label className="text-sm font-medium text-slate-700">Temporary password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required /></label>}
              <label className="text-sm font-medium text-slate-700">Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="text-sm font-medium text-slate-700">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500">{ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
            </div>
            {actionError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : editingUser ? 'Save changes' : 'Create user'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
