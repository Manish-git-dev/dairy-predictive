import React from "react";
import useFetch from "../../hooks/useFetch";
import userService from "../../services/userService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function UserRoleManagementPage() {
  const { data, loading, error } = useFetch(userService.getAllUsers);

  if (loading) return <LoadingSpinner label="Loading users..." />;

  const users = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User & Role Management</h1>
        <div className="text-sm text-slate-500">{users.length} users</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found</div>
        ) : (
          <table className="w-full table-auto min-w-[720px]">
            <thead className="text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.active ? "Active" : "Disabled"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-600 px-3 py-1 text-white">
                        Edit
                      </button>
                      <button className="rounded border px-3 py-1">
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
