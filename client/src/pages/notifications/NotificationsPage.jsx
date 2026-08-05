import React from "react";
import { useNotifications } from "../../context/NotificationContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  if (loading) return <LoadingSpinner label="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">Unread: {unreadCount}</div>
          <button onClick={markAllAsRead} className="rounded border px-3 py-1">
            Mark all read
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No notifications</div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${n.read ? "bg-slate-50" : "bg-white"}`}
              >
                <div>
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-slate-500">{n.message}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="rounded bg-emerald-600 px-3 py-1 text-white"
                    >
                      Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n._id)}
                    className="rounded border px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
