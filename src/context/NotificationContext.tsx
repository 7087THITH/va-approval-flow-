import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'approval_pending' | 'approved' | 'rejected' | 'returned' | 'return_update' | 'submitted' | 'info';
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  proposalId?: string;
  proposalNo?: string;
  fromUserId?: string;
  fromUserName?: string;
  createdAt: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Demo notifications
const demoNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'approval_pending',
    title: 'New Approval Request',
    titleTh: 'คำขออนุมัติใหม่',
    message: 'VA-2024-001 "Compressor Housing Unit A-200" is waiting for your approval.',
    messageTh: 'VA-2024-001 "Compressor Housing Unit A-200" รอการอนุมัติจากคุณ',
    proposalId: 'prop-1',
    proposalNo: 'VA-2024-001',
    fromUserId: 'user-1',
    fromUserName: 'John Smith',
    createdAt: new Date('2024-01-15T10:00:00'),
    read: false,
  },
  {
    id: 'notif-2',
    type: 'approved',
    title: 'Proposal Approved',
    titleTh: 'เอกสารได้รับการอนุมัติ',
    message: 'VA-2024-002 "Fan Blade Assembly B-150" has been approved by Sarah Johnson.',
    messageTh: 'VA-2024-002 "Fan Blade Assembly B-150" ได้รับการอนุมัติจาก Sarah Johnson',
    proposalId: 'prop-2',
    proposalNo: 'VA-2024-002',
    fromUserId: 'user-2',
    fromUserName: 'Sarah Johnson',
    createdAt: new Date('2024-01-12T14:30:00'),
    read: false,
  },
  {
    id: 'notif-3',
    type: 'rejected',
    title: 'Proposal Rejected',
    titleTh: 'เอกสารถูกปฏิเสธ',
    message: 'VA-2024-003 "Refrigerant Valve Core" has been rejected. Reason: Supplier not yet certified.',
    messageTh: 'VA-2024-003 "Refrigerant Valve Core" ถูกปฏิเสธ เหตุผล: ซัพพลายเออร์ยังไม่ได้รับการรับรอง',
    proposalId: 'prop-3',
    proposalNo: 'VA-2024-003',
    fromUserId: 'user-2',
    fromUserName: 'Sarah Johnson',
    createdAt: new Date('2024-01-09T09:15:00'),
    read: true,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
