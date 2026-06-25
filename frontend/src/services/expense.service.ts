import api from './api';
import { User } from '../context/AuthContext';

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';

export interface ExpenseSplit {
  id: number;
  user: User;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: number;
  paidBy: User;
  title: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  splitType: SplitType;
  receiptUrl?: string;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface Reimbursement {
  id: number;
  fromUser: User;
  toUser: User;
  amount: number;
  date: string;
  settled: boolean;
  createdAt: string;
}

export interface SplitRequest {
  userId: number;
  amount?: number;
  percentage?: number;
}

export interface ExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  date: string;
  category: string;
  paidById: number;
  splitType: SplitType;
  receiptUrl?: string;
  splits: SplitRequest[];
}

const expenseService = {
  addExpense: async (groupId: number, data: ExpenseRequest) => {
    const response = await api.post<Expense>(`/groups/${groupId}/expenses`, data);
    return response.data;
  },

  getGroupExpenses: async (groupId: number) => {
    const response = await api.get<Expense[]>(`/groups/${groupId}/expenses`);
    return response.data;
  },

  deleteExpense: async (expenseId: number) => {
    await api.delete(`/expenses/${expenseId}`);
  },

  recordReimbursement: async (groupId: number, fromUserId: number, toUserId: number, amount: number, date: string) => {
    const response = await api.post<Reimbursement>(`/groups/${groupId}/reimbursements`, {
      fromUserId,
      toUserId,
      amount,
      date,
    });
    return response.data;
  },

  getGroupReimbursements: async (groupId: number) => {
    const response = await api.get<Reimbursement[]>(`/groups/${groupId}/reimbursements`);
    return response.data;
  },
};

export default expenseService;
