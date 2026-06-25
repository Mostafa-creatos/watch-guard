import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import groupService, { Group } from '../services/group.service';
import expenseService, { Expense, Reimbursement } from '../services/expense.service';
import { Layout } from '../components/Layout';
import {
  Calendar,
  Filter,
  Search,
  Users,
  DollarSign,
  Trash2,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

interface CombinedHistoryItem {
  id: number;
  type: 'expense' | 'reimbursement';
  title: string;
  description: string;
  amount: number;
  date: string;
  payerName: string;
  recipientName?: string;
  category?: string;
  groupId: number;
  groupName: string;
  receiptUrl?: string;
}

export const History: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [historyItems, setHistoryItems] = useState<CombinedHistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CombinedHistoryItem[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const fetchHistoryData = async () => {
    try {
      const userGroups = await groupService.getGroups();
      setGroups(userGroups);

      if (userGroups.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch expenses & settlements for each group
      const allExpensesPromises = userGroups.map(g => expenseService.getGroupExpenses(g.id));
      const allReimbursementsPromises = userGroups.map(g => expenseService.getGroupReimbursements(g.id));

      const allExpensesResults = await Promise.all(allExpensesPromises);
      const allReimbursementsResults = await Promise.all(allReimbursementsPromises);

      const items: CombinedHistoryItem[] = [];

      userGroups.forEach((group, idx) => {
        const groupExpenses = allExpensesResults[idx];
        const groupReimbursements = allReimbursementsResults[idx];

        groupExpenses.forEach(e => {
          items.push({
            id: e.id,
            type: 'expense',
            title: e.title,
            description: e.description || '',
            amount: e.amount,
            date: e.date,
            payerName: e.paidBy.fullName,
            category: e.category,
            groupId: group.id,
            groupName: group.name,
            receiptUrl: e.receiptUrl
          });
        });

        groupReimbursements.forEach(r => {
          items.push({
            id: r.id,
            type: 'reimbursement',
            title: 'Repayment Recorded',
            description: '',
            amount: r.amount,
            date: r.date,
            payerName: r.fromUser.fullName,
            recipientName: r.toUser.fullName,
            groupId: group.id,
            groupName: group.name,
          });
        });
      });

      setHistoryItems(items);
      setFilteredItems(items);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  // Apply filters and sorting in real-time
  useEffect(() => {
    let result = [...historyItems];

    // Search query filter (title, description, payer, group)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.payerName.toLowerCase().includes(q) ||
          item.groupName.toLowerCase().includes(q) ||
          (item.recipientName && item.recipientName.toLowerCase().includes(q))
      );
    }

    // Group filter
    if (selectedGroup !== 'all') {
      result = result.filter(item => item.groupId.toString() === selectedGroup);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Date range filter
    if (startDate) {
      result = result.filter(item => new Date(item.date) >= new Date(startDate));
    }
    if (endDate) {
      result = result.filter(item => new Date(item.date) <= new Date(endDate));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    setFilteredItems(result);
  }, [historyItems, searchQuery, selectedGroup, selectedCategory, startDate, endDate, sortBy]);

  const handleDeleteExpense = async (expenseId: number) => {
    if (!window.confirm('Delete this expense? This action is irreversible.')) return;
    try {
      await expenseService.deleteExpense(expenseId);
      // Remove local item
      setHistoryItems(prev => prev.filter(item => !(item.type === 'expense' && item.id === expenseId)));
    } catch (err: any) {
      alert(err.response?.data || 'Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('history')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Complete transaction list. Filter, sort, and search.
          </p>
        </div>

        {/* Filters Panel Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-255 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
            <Filter className="w-4 h-4 text-primary-500" />
            <span>Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                placeholder={t('search')}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-primary-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Group Filter */}
            <div>
              <select
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-primary-500 transition-all font-semibold"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="all">All Groups</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-primary-500 transition-all font-semibold"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="food">{t('food')}</option>
                <option value="transport">{t('transport')}</option>
                <option value="rent">{t('rent')}</option>
                <option value="entertainment">{t('entertainment')}</option>
                <option value="shopping">{t('shopping')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-primary-500 transition-all font-semibold"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* History Grid */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-450 text-sm shadow-sm">
              No matching records found.
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={`${item.type}-${item.id}-${index}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between group/item"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    item.type === 'expense'
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {item.type === 'expense' ? item.category?.[0].toUpperCase() || 'E' : 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                    <span className="text-xs text-slate-450 dark:text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {item.type === 'expense'
                          ? `${item.payerName} paid`
                          : `${item.payerName} paid ${item.recipientName}`}
                      </span>
                      <span>•</span>
                      <span className="text-primary-500 font-semibold">{item.groupName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString(language)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-bold text-sm ${
                    item.type === 'expense' ? 'text-slate-850 dark:text-slate-200' : 'text-emerald-500'
                  }`}>
                    {item.type === 'expense' ? '-' : '+'}{item.amount.toFixed(2)} MAD
                  </span>

                  {item.type === 'expense' && (
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-650 dark:hover:bg-slate-850 dark:hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};
