import api from './api';
import { User } from '../context/AuthContext';

export interface Group {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: User;
  members: User[];
  createdAt: string;
}

export interface Debt {
  debtor: User;
  creditor: User;
  amount: number;
}

export interface DashboardSummary {
  totalExpenses: number;
  youPaid: number;
  youOwe: number;
  youAreOwed: number;
  simplifiedDebts: Debt[];
  memberBalances: Record<number, number>;
}

const groupService = {
  getGroups: async () => {
    const response = await api.get<Group[]>('/groups');
    return response.data;
  },

  getGroupById: async (id: number) => {
    const response = await api.get<Group>(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (name: string, description: string) => {
    const response = await api.post<Group>('/groups', { name, description });
    return response.data;
  },

  joinGroup: async (inviteCode: string) => {
    const response = await api.post<Group>('/groups/join', { inviteCode });
    return response.data;
  },

  addMember: async (groupId: number, emailOrUsername: string) => {
    const response = await api.post<Group>(`/groups/${groupId}/members`, { emailOrUsername });
    return response.data;
  },

  getGroupSummary: async (groupId: number) => {
    const response = await api.get<DashboardSummary>(`/groups/${groupId}/summary`);
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get<DashboardSummary>('/groups/dashboard/summary');
    return response.data;
  },
};

export default groupService;
