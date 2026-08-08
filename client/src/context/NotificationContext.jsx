import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import notificationService from '../services/notificationService';

export const NotificationContext = createContext(null);

const POLL_VISIBLE_MS = 10000;
const POLL_HIDDEN_MS = 60000;
const MAX_NOTIFICATIONS = 100;

const unwrap = (response) => response?.data?.data ?? response?.data ?? {};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const latestTimestampRef = useRef(null);
  const pollTimerRef = useRef(null);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const updateCursor = useCallback((items) => {
    if (!items?.length) return;
    const newest = items.reduce((latest, item) => {
      const value = new Date(item.createdAt).getTime();
      return Number.isFinite(value) && value > latest ? value : latest;
    }, latestTimestampRef.current ? new Date(latestTimestampRef.current).getTime() : 0);
    if (newest) latestTimestampRef.current = new Date(newest).toISOString();
  }, []);

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getAll({ limit: 50, ...params });
      const result = unwrap(response);
      const items = result.items || [];
      setNotifications(items);
      updateCursor(items);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, updateCursor]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationService.getUnreadCount();
      const count = unwrap(response);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [isAuthenticated]);

  const fetchNewNotifications = useCallback(async () => {
    if (!isAuthenticated || !latestTimestampRef.current || document.visibilityState === 'hidden') return;
    try {
      const result = unwrap(await notificationService.getAll({
        limit: 50,
        since: latestTimestampRef.current,
        ...filtersRef.current,
      }));
      const incoming = result.items || [];
      if (incoming.length) {
        setNotifications((prev) => {
          const existing = new Set(prev.map((item) => item._id));
          const fresh = incoming.filter((item) => !existing.has(item._id));
          return [...fresh, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
        updateCursor(incoming);
      }
      await fetchUnreadCount();
    } catch (err) {
      // Keep the current UI usable; the next cycle retries automatically.
      console.error('Realtime notification sync failed:', err);
    }
  }, [isAuthenticated, fetchUnreadCount, updateCursor]);

  const refreshNotifications = useCallback(async (nextFilters = filtersRef.current) => {
    if (!isAuthenticated) return;
    latestTimestampRef.current = null;
    setFilters(nextFilters || {});
    await Promise.all([
      fetchNotifications(nextFilters || {}),
      fetchUnreadCount(),
    ]);
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      latestTimestampRef.current = null;
      return undefined;
    }

    refreshNotifications({});

    const schedule = () => {
      window.clearTimeout(pollTimerRef.current);
      const delay = document.visibilityState === 'visible' ? POLL_VISIBLE_MS : POLL_HIDDEN_MS;
      pollTimerRef.current = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          await fetchNewNotifications();
        } else {
          await fetchUnreadCount();
        }
        schedule();
      }, delay);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchNewNotifications();
      schedule();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    schedule();
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearTimeout(pollTimerRef.current);
    };
  }, [isAuthenticated, refreshNotifications, fetchNewNotifications, fetchUnreadCount]);

  const markAsRead = async (id) => {
    try {
      const notification = notifications.find((n) => n._id === id);
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)));
      if (notification && !notification.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (id) => {
    try {
      const notification = notifications.find((n) => n._id === id);
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notification && !notification.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    filters,
    setFilters: (nextFilters) => refreshNotifications(nextFilters),
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export default NotificationContext;
