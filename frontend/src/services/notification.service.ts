import api from './api';

export interface Notification {
  id: number;
  message: string;
  type: 'EXPENSE_ADDED' | 'REPAYMENT_ADDED' | 'REPAYMENT_REMINDER' | 'SETTLEMENT_CONFIRMATION';
  read: boolean;
  createdAt: string;
  targetId?: number;
  targetType?: 'EXPENSE' | 'REIMBURSEMENT';
}

const notificationService = {
  getNotifications: async () => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  getUnreadNotifications: async () => {
    const response = await api.get<Notification[]>('/notifications/unread');
    return response.data;
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all');
  },
};

export default notificationService;
