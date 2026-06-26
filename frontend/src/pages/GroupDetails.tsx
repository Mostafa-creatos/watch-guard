import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import groupService, { Group, DashboardSummary, Debt } from '../services/group.service';
import expenseService, { Expense, Reimbursement, SplitType, SplitRequest } from '../services/expense.service';
import { Layout } from '../components/Layout';
import {
  Plus,
  Users,
  Calendar,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  DollarSign,
  PlusCircle,
  Copy,
  Check,
  ChevronDown,
  Image,
  FileText,
  Share2,
  X
} from 'lucide-react';

export const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);

  const { user } = useAuth();
  const { t, isRtl, language } = useLanguage();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Clipboard copies
  const [copied, setCopied] = useState(false);

  // Forms
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));
  const [expenseCategory, setExpenseCategory] = useState('food');
  const [expensePaidBy, setExpensePaidBy] = useState<number>(user?.id || 0);
  const [expenseSplitType, setExpenseSplitType] = useState<SplitType>('EQUAL');
  const [expenseReceipt, setExpenseReceipt] = useState('');

  // Splits tracking: user_id -> value (amount or percentage or checked)
  const [checkedUsers, setCheckedUsers] = useState<Record<number, boolean>>({});
  const [exactAmounts, setExactAmounts] = useState<Record<number, string>>({});
  const [percentages, setPercentages] = useState<Record<number, string>>({});

  // Settle Up Form
  const [settleFromUser, setSettleFromUser] = useState<number>(0);
  const [settleToUser, setSettleToUser] = useState<number>(0);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDate, setSettleDate] = useState(new Date().toISOString().substring(0, 10));

  // Add Member Form
  const [newMemberInput, setNewMemberInput] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchGroupData = async () => {
    try {
      const g = await groupService.getGroupById(groupId);
      setGroup(g);
      
      const s = await groupService.getGroupSummary(groupId);
      setSummary(s);

      const exp = await expenseService.getGroupExpenses(groupId);
      setExpenses(exp);

      const reim = await expenseService.getGroupReimbursements(groupId);
      setReimbursements(reim);
      
      // Initialize forms default selected users
      if (g.members.length > 0) {
        // Equal split starts with everyone checked
        const checks: Record<number, boolean> = {};
        const amounts: Record<number, string> = {};
        const percents: Record<number, string> = {};
        
        g.members.forEach(m => {
          checks[m.id] = true;
          amounts[m.id] = '';
          percents[m.id] = '';
        });
        
        setCheckedUsers(checks);
        setExactAmounts(amounts);
        setPercentages(percents);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
    window.addEventListener('transaction-updated', fetchGroupData);
    return () => window.removeEventListener('transaction-updated', fetchGroupData);
  }, [groupId]);

  const copyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openReceiptModal = (item: any) => {
    setSelectedReceipt(item);
    setReceiptModalOpen(true);
  };

  const handleShareReceipt = () => {
    if (!selectedReceipt) return;
    const shareText = t('shareMsg')
      .replace('{amount}', selectedReceipt.amount.toFixed(2))
      .replace('{group}', group?.name || '');

    if (navigator.share) {
      navigator.share({
        title: t('reimbursementReceipt'),
        text: shareText,
      }).catch(err => console.error('Share error:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    if (!selectedReceipt) return;
    const payerName = selectedReceipt.payer;
    const recipientName = selectedReceipt.recipient || selectedReceipt.recipientName || '';
    const textContent = `
=========================================
           WATCH GUARD RECEIPT
=========================================
Receipt ID: WR-${selectedReceipt.id}-${Date.now().toString().slice(-4)}
Group: ${group?.name}
Date: ${new Date(selectedReceipt.date).toLocaleDateString(language)}
Type: Settlement Payment
Payer: ${payerName}
Recipient: ${recipientName}
Amount: ${selectedReceipt.amount.toFixed(2)} MAD
Status: CONFIRMED & SETTLED
=========================================
Thank you for using Watch Guard!
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${selectedReceipt.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberInput.trim()) return;
    setSubmitLoading(true);
    setError('');
    
    try {
      await groupService.addMember(groupId, newMemberInput);
      setSuccessMsg(t('inviteSuccess'));
      setNewMemberInput('');
      setMemberModalOpen(false);
      fetchGroupData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to add member');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const splitRequests: SplitRequest[] = [];

    if (expenseSplitType === 'EQUAL') {
      const activeUserIds = Object.keys(checkedUsers)
        .map(Number)
        .filter(id => checkedUsers[id]);

      if (activeUserIds.length === 0) {
        setError('At least one member must be selected for equal split');
        return;
      }
      activeUserIds.forEach(id => {
        splitRequests.push({ userId: id });
      });
    } 
    else if (expenseSplitType === 'EXACT') {
      let sum = 0;
      for (const m of group?.members || []) {
        const val = parseFloat(exactAmounts[m.id] || '0');
        if (val < 0) {
          setError('Split amounts cannot be negative');
          return;
        }
        if (val > 0) {
          splitRequests.push({ userId: m.id, amount: val });
          sum += val;
        }
      }
      // Sum validation
      if (Math.abs(sum - amt) > 0.02) {
        setError(`Sum of exact splits (${sum.toFixed(2)}) must equal total expense amount (${amt.toFixed(2)})`);
        return;
      }
    } 
    else if (expenseSplitType === 'PERCENTAGE') {
      let sum = 0;
      for (const m of group?.members || []) {
        const val = parseFloat(percentages[m.id] || '0');
        if (val < 0) {
          setError('Percentage values cannot be negative');
          return;
        }
        if (val > 0) {
          splitRequests.push({ userId: m.id, percentage: val });
          sum += val;
        }
      }
      // Percent validation
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Sum of percentages must equal 100% (was: ${sum.toFixed(1)}%)`);
        return;
      }
    }

    setSubmitLoading(true);
    try {
      await expenseService.addExpense(groupId, {
        title: expenseTitle,
        description: expenseDesc,
        amount: amt,
        date: expenseDate,
        category: expenseCategory,
        paidById: expensePaidBy,
        splitType: expenseSplitType,
        receiptUrl: expenseReceipt || undefined,
        splits: splitRequests,
      });

      // Clear Form
      setExpenseTitle('');
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseReceipt('');
      setExpenseModalOpen(false);
      fetchGroupData();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to add expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSettleUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!settleFromUser || !settleToUser) {
      setError('Please select both payer and recipient');
      return;
    }
    if (settleFromUser === settleToUser) {
      setError('Payer and recipient must be different');
      return;
    }

    setSubmitLoading(true);
    try {
      await expenseService.recordReimbursement(groupId, settleFromUser, settleToUser, amt, settleDate);
      setSettleAmount('');
      setSettleModalOpen(false);
      fetchGroupData();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to record payment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expenseService.deleteExpense(expenseId);
      fetchGroupData();
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

  if (!group || !summary) {
    return (
      <Layout>
        <div className="p-6 bg-red-50 text-red-600 rounded-xl">Group not found.</div>
      </Layout>
    );
  }

  // Pre-calculate Equal split previews
  const amountFloat = parseFloat(expenseAmount) || 0;
  const equalActiveCount = Object.values(checkedUsers).filter(Boolean).length;
  const equalPreviewShare = equalActiveCount > 0 ? (amountFloat / equalActiveCount).toFixed(2) : '0.00';

  // Pre-calculate Exact remaining amount
  const exactSum = Object.values(exactAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const exactRemaining = amountFloat - exactSum;

  // Pre-calculate Percentage remaining
  const percentSum = Object.values(percentages).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const percentRemaining = 100 - percentSum;

  const categories = [
    { value: 'food', label: t('food') },
    { value: 'transport', label: t('transport') },
    { value: 'rent', label: t('rent') },
    { value: 'entertainment', label: t('entertainment') },
    { value: 'shopping', label: t('shopping') },
    { value: 'other', label: t('other') }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{group.name}</h2>
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 text-xs font-semibold rounded-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                title="Copy Invite Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{group.inviteCode}</span>
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl">{group.description || t('noDescription')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setExpenseModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-550 hover:from-primary-700 hover:to-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-600/20 hover:shadow-primary-600/35 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('addExpense')}
            </button>
            <button
              onClick={() => {
                // Initialize default settle users based on first debt
                if (summary.simplifiedDebts.length > 0) {
                  const firstDebt = summary.simplifiedDebts[0];
                  setSettleFromUser(firstDebt.debtor.id);
                  setSettleToUser(firstDebt.creditor.id);
                  setSettleAmount(firstDebt.amount.toString());
                } else {
                  setSettleFromUser(group.members[0]?.id || 0);
                  setSettleToUser(group.members[1]?.id || 0);
                }
                setSettleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {t('settleUp')}
            </button>
            <button
              onClick={() => setMemberModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {t('addMember')}
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-450 text-sm font-semibold">
            {successMsg}
          </div>
        )}

        {/* Group Financial Summary Balances & Minimized Debts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member balances sheet */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              {t('memberBalances')}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.members.map((member) => {
                const bal = summary.memberBalances[member.id] || 0;
                return (
                  <div key={member.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center justify-center font-bold text-sm">
                        {member.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {member.fullName} {member.id === user?.id ? `(${t('profile')})` : ''}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">@{member.username}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {bal > 0 ? (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {t('getsBack')} {bal.toFixed(2)} MAD
                        </span>
                      ) : bal < 0 ? (
                        <span className="text-sm font-bold text-red-650 dark:text-red-400">
                          {t('owes')} {Math.abs(bal).toFixed(2)} MAD
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                          {t('settledUpLabel')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimized Debts (Who owes whom) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-500" />
                {t('simplifiedDebts')}
              </h3>

              {summary.simplifiedDebts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-450 text-sm">
                  {t('settledUp')}
                </div>
              ) : (
                <div className="space-y-4">
                  {summary.simplifiedDebts.map((debt, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-850">
                      <div className="text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{debt.debtor.fullName}</span>
                        <span className="text-slate-400 mx-2">{t('youOweUser')}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{debt.creditor.fullName}</span>
                      </div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 text-right">
                        {debt.amount.toFixed(2)} MAD
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {summary.simplifiedDebts.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-primary-500" />
                {t('balancesSimplified')}
              </div>
            )}
          </div>
        </div>

        {/* History of Expenses & Settlements */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
            {t('history')}
          </h3>

          {expenses.length === 0 && reimbursements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-450 text-sm shadow-sm">
              {t('noTransactions')}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Combine and Sort by Created date or Date */}
              {(() => {
                const items: Array<{
                  id: number;
                  type: 'expense' | 'reimbursement';
                  title: string;
                  amount: number;
                  date: string;
                  payer: string;
                  recipient?: string;
                  category?: string;
                  receiptUrl?: string;
                  detail: string;
                  confirmed?: boolean;
                }> = [];

                expenses.forEach(e => {
                  items.push({
                    id: e.id,
                    type: 'expense',
                    title: e.title,
                    amount: e.amount,
                    date: e.date,
                    payer: e.paidBy.fullName,
                    category: e.category,
                    receiptUrl: e.receiptUrl,
                    detail: `${e.paidBy.fullName} ${t('paid')} ${e.amount.toFixed(2)} MAD`,
                    confirmed: e.confirmed
                  });
                });

                reimbursements.forEach(r => {
                  items.push({
                    id: r.id,
                    type: 'reimbursement',
                    title: t('paymentRecorded'),
                    amount: r.amount,
                    date: r.date,
                    payer: r.fromUser.fullName,
                    recipient: r.toUser.fullName,
                    detail: `${r.fromUser.fullName} ${t('paidUser')} ${r.toUser.fullName} ${r.amount.toFixed(2)} MAD`,
                    confirmed: r.settled
                  });
                });

                // Sort by date desc
                items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return items.map((item, index) => (
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
                        {item.type === 'expense' ? item.title[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                          {!item.confirmed && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                              {t('pendingConfirmation')}
                            </span>
                          )}
                          {item.receiptUrl && (
                            <a
                              href={item.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="View Receipt"
                            >
                              <Image className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-2 mt-1">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">{item.detail}</span>
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
                        item.type === 'expense' ? 'text-slate-800 dark:text-slate-200' : 'text-emerald-500'
                      }`}>
                        {item.type === 'expense' ? '-' : '+'}{item.amount.toFixed(2)} MAD
                      </span>

                      {item.type === 'expense' && (
                        <button
                          onClick={() => handleDeleteExpense(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-600 dark:hover:bg-slate-850 dark:hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all duration-200"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {item.type === 'reimbursement' && item.confirmed && (
                        <button
                          onClick={() => openReceiptModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-slate-850 dark:hover:text-primary-400 transition-all cursor-pointer"
                          title={t('receipt')}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setExpenseModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative z-10 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('addExpense')}
            </h3>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-650 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                    {t('expenseTitle')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dinner, Rent"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-755 dark:text-slate-350 mb-1">
                    {t('amount')} (MAD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                    {t('category')}
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                  {t('paidBy')}
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(Number(e.target.value))}
                >
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Splits Settings */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t('splitMethod')}
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    {(['EQUAL', 'EXACT', 'PERCENTAGE'] as SplitType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setExpenseSplitType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          expenseSplitType === type
                            ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-sm border border-slate-200/30 dark:border-slate-750'
                            : 'text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {type === 'EQUAL' && t('equal')}
                        {type === 'EXACT' && t('custom')}
                        {type === 'PERCENTAGE' && t('percentage')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-Forms depending on split type */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 max-h-56 overflow-y-auto space-y-3">
                  {expenseSplitType === 'EQUAL' && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {t('selectMembersCost')} (Previews: {equalPreviewShare} MAD each)
                      </div>
                      {group.members.map((m) => (
                        <label key={m.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded text-primary-500 focus:ring-primary-500 border-slate-300 dark:border-slate-800 w-4 h-4"
                            checked={!!checkedUsers[m.id]}
                            onChange={(e) => setCheckedUsers(prev => ({ ...prev, [m.id]: e.target.checked }))}
                          />
                          <span className="text-sm font-medium text-slate-750 dark:text-slate-300">{m.fullName}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {expenseSplitType === 'EXACT' && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        <span>{t('inputExactAmounts')}</span>
                        <span className={exactRemaining === 0 ? 'text-emerald-500' : 'text-red-500 font-bold'}>
                          {exactRemaining === 0
                            ? t('allSettled')
                            : exactRemaining > 0
                            ? `${exactRemaining.toFixed(2)} MAD ${t('remaining')}`
                            : `${Math.abs(exactRemaining).toFixed(2)} MAD ${t('overTotal')}`}
                        </span>
                      </div>
                      {group.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-slate-755 dark:text-slate-300">{m.fullName}</span>
                          <div className="relative w-32">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-3 pr-8 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none text-right font-semibold text-sm"
                              value={exactAmounts[m.id] || ''}
                              onChange={(e) => setExactAmounts(prev => ({ ...prev, [m.id]: e.target.value }))}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">MAD</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {expenseSplitType === 'PERCENTAGE' && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        <span>{t('inputPercentage')}</span>
                        <span className={percentRemaining === 0 ? 'text-emerald-500' : 'text-red-500 font-bold'}>
                          {percentRemaining === 0
                            ? `100% ${t('settled')}`
                            : percentRemaining > 0
                            ? `${percentRemaining.toFixed(1)}% ${t('remaining')}`
                            : `${Math.abs(percentRemaining).toFixed(1)}% ${t('overTotal')}`}
                        </span>
                      </div>
                      {group.members.map((m) => {
                        const pct = parseFloat(percentages[m.id] || '0') || 0;
                        const calcShare = (amountFloat * pct / 100).toFixed(2);
                        return (
                          <div key={m.id} className="flex items-center justify-between gap-4">
                            <div>
                              <span className="text-sm font-medium text-slate-755 dark:text-slate-350">{m.fullName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-550 block">({calcShare} MAD)</span>
                            </div>
                            <div className="relative w-24">
                              <input
                                type="number"
                                step="1"
                                placeholder="0"
                                className="w-full pl-3 pr-6 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none text-right font-semibold text-sm"
                                value={percentages[m.id] || ''}
                                onChange={(e) => setPercentages(prev => ({ ...prev, [m.id]: e.target.value }))}
                              />
                              <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                  {t('receiptUpload')}
                </label>
                <input
                  type="text"
                  placeholder="Receipt URL (e.g. image link)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={expenseReceipt}
                  onChange={(e) => setExpenseReceipt(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                  {t('expenseDesc')}
                </label>
                <textarea
                  rows={2}
                  placeholder="Add details (optional)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm resize-none"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/10 transition-all flex items-center gap-2"
                >
                  {submitLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {settleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSettleModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('settleDebt')}
            </h3>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSettleUp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-755 dark:text-slate-350 mb-1">
                  {t('payerFromUser')}
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={settleFromUser}
                  onChange={(e) => setSettleFromUser(Number(e.target.value))}
                >
                  <option value={0}>{t('selectPayer')}</option>
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-755 dark:text-slate-350 mb-1">
                  {t('recipientToUser')}
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={settleToUser}
                  onChange={(e) => setSettleToUser(Number(e.target.value))}
                >
                  <option value={0}>{t('selectRecipient')}</option>
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                  {t('amount')} (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                  {t('date')}
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/10 transition-all flex items-center gap-2"
                >
                  {submitLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('settleUp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMemberModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('addMember')}
            </h3>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-655 dark:text-red-400 text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-750 dark:text-slate-350 mb-1">
                  {t('inviteEmail')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter email address or username"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={newMemberInput}
                  onChange={(e) => setNewMemberInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 font-semibold text-sm transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/10 transition-all flex items-center gap-2"
                >
                  {submitLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('invite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReceiptModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-205">
            
            {/* Top Graphic Header */}
            <div className="bg-gradient-to-br from-primary-600 to-emerald-500 p-6 text-center text-white relative">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setReceiptModalOpen(false)}
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-extrabold text-lg uppercase tracking-wider">{t('reimbursementReceipt')}</h4>
              <p className="text-white/80 text-xs mt-1">Watch Guard Secure Settlement</p>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-6 relative bg-slate-50/50 dark:bg-slate-950/20">
              
              {/* Receipt Ticket Shape / Dashed Divider */}
              <div className="border-b-2 border-dashed border-slate-200 dark:border-slate-800 pb-4 text-center">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Receipt Number</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  WR-{selectedReceipt.id}-{Math.floor(1000 + Math.random() * 9000)}
                </span>
              </div>

              {/* Amount Display */}
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('amount')}</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedReceipt.amount.toFixed(2)} <span className="text-lg font-bold text-slate-500">MAD</span>
                </h3>
              </div>

              {/* Key Details Grid */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-sm text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-550 font-medium">{t('groups')}</span>
                  <span className="font-bold text-slate-755 dark:text-slate-200">{group?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-550 font-medium">{t('date')}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(selectedReceipt.date).toLocaleDateString(language)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-50 dark:border-slate-800/30 pt-2.5">
                  <span className="text-slate-400 dark:text-slate-550 font-medium">{t('payerFromUser')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReceipt.payer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-550 font-medium">{t('recipientToUser')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedReceipt.recipient || selectedReceipt.recipientName || ''}
                  </span>
                </div>
              </div>

              {/* Decorative Tear-off Border simulation */}
              <div className="flex justify-between gap-1 text-slate-200 dark:text-slate-800 overflow-hidden h-2 select-none">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-white dark:bg-slate-900 rounded-full -mt-2 shrink-0 border border-slate-250 dark:border-slate-800" />
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50 flex gap-2">
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {t('download')}
              </button>
              <button
                onClick={handleShareReceipt}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-550 hover:from-primary-700 hover:to-primary-600 text-white font-bold text-xs shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {t('copiedToClipboard')}
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    {t('shareReceipt')}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
};
