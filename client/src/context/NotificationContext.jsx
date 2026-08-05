import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import useAuth from '../hooks/useAuth';
import notificationService from '../services/notificationService';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (params) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await notificationService.getAll(params);
      // Backend response data: { success: true, data: { items: [...], total, page, limit, totalPages } }
      const items = response.data?.items || response.data || [];
      setNotifications(items);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationService.getUnreadCount();
      // Backend response data: { success: true, data: number }
      const count = response.data !== undefined ? response.data : 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async (params) => {
    if (isAuthenticated) {
      await Promise.all([fetchNotifications(params), fetchUnreadCount()]);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
      const interval = setInterval(() => {
        refreshNotifications();
      }, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      refreshNotifications();
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      refreshNotifications();
      throw err;
    }
  };

  const deleteNotification = async (id) => {
    try {
      const notification = notifications.find((n) => n._id === id);
      const wasUnread = notification ? !notification.read : false;
      
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      refreshNotifications();
      throw err;
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
