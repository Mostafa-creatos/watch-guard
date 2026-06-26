import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import groupService, { Group, DashboardSummary } from '../services/group.service';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Search,
  Users,
  ChevronRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const summaryData = await groupService.getDashboardSummary();
      setSummary(summaryData);
      const groupsData = await groupService.getGroups();
      setGroups(groupsData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    window.addEventListener('transaction-updated', fetchDashboardData);
    return () => window.removeEventListener('transaction-updated', fetchDashboardData);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setModalLoading(true);
    try {
      await groupService.createGroup(newGroupName, newGroupDesc);
      setNewGroupName('');
      setNewGroupDesc('');
      setCreateModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to create group');
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setModalLoading(true);
    try {
      await groupService.joinGroup(inviteCode);
      setInviteCode('');
      setJoinModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to join group');
    } finally {
      setModalLoading(false);
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

  const netBalance = (summary?.youAreOwed || 0) - (summary?.youOwe || 0);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {t('hello')}, {user?.fullName}!
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t('welcomeBack')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-550 hover:from-primary-700 hover:to-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-600/20 hover:shadow-primary-600/35 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('createGroup')}
            </button>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              {t('joinGroup')}
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Spent */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-550 dark:text-slate-450 uppercase tracking-wider">{t('totalExpenses')}</span>
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{(summary?.totalExpenses || 0).toFixed(2)}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">MAD</span>
            </div>
          </div>

          {/* Card 2: You Paid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-550 dark:text-slate-450 uppercase tracking-wider">{t('youPaid')}</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{(summary?.youPaid || 0).toFixed(2)}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">MAD</span>
            </div>
          </div>

          {/* Card 3: You Owe */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-550 dark:text-slate-450 uppercase tracking-wider">{t('youOwe')}</span>
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-red-650 dark:text-red-400">{(summary?.youOwe || 0).toFixed(2)}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">MAD</span>
            </div>
          </div>

          {/* Card 4: You Are Owed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-550 dark:text-slate-450 uppercase tracking-wider">{t('youAreOwed')}</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(summary?.youAreOwed || 0).toFixed(2)}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">MAD</span>
            </div>
          </div>
        </div>

        {/* Global Net Balance Graph Indicator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{t('netBalance')}</h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              netBalance > 0
                ? 'bg-emerald-500/10 text-emerald-500'
                : netBalance < 0
                ? 'bg-red-500/10 text-red-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {netBalance > 0 ? `+${netBalance.toFixed(2)} MAD` : `${netBalance.toFixed(2)} MAD`}
            </span>
          </div>
          {/* Simple Visual Scale */}
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
            <div className="w-1/2 bg-red-400 h-full border-r border-white dark:border-slate-900" />
            <div className="w-1/2 bg-emerald-400 h-full" />
            {/* Net Balance Cursor Indicator */}
            {(() => {
              const maxRange = Math.max(100, Math.abs(summary?.youOwe || 0), Math.abs(summary?.youAreOwed || 0));
              const pct = 50 + (netBalance / maxRange) * 50; // Map range -maxRange to +maxRange into 0% to 100%
              const clampedPct = Math.min(98, Math.max(2, pct));
              return (
                <div
                  className="absolute top-[-2px] bottom-[-2px] w-2 bg-slate-800 dark:bg-slate-100 border border-white dark:border-slate-900 rounded-full shadow-lg transition-all duration-500"
                  style={{ [isRtl ? 'right' : 'left']: `${clampedPct}%` }}
                />
              );
            })()}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-semibold">
            <span>{t('owedToOthers')}</span>
            <span>{t('settled')}</span>
            <span>{t('owedToYou')}</span>
          </div>
        </div>

        {/* Groups Grid Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            {t('groups')}
          </h3>

          {groups.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-450 font-medium">{t('noGroups')}</p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-primary-500/10"
                >
                  {t('createGroup')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                // Determine user balance within this group (mock or calculate if available)
                // In group calculate summary we get memberBalances which maps user IDs to net balance.
                // Let's retrieve this if we want, or display a standard redirect link to detail.
                return (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {group.name}
                        </h4>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {group.members.length}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 line-clamp-2">
                        {group.description || t('noDescription')}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-slate-550">
                        Code: <code className="font-mono text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded font-bold">{group.inviteCode}</code>
                      </span>
                      <span className="text-xs font-semibold text-primary-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {t('viewDetails')}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('createGroup')}
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
                  {t('groupName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roommates 101, Summer Trip"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
                  {t('groupDesc')}
                </label>
                <textarea
                  rows={3}
                  placeholder={t('whatIsGroupFor')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm resize-none"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/10 transition-all flex items-center gap-2"
                >
                  {modalLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setJoinModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('joinGroup')}
            </h3>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
                  {t('inviteLink')} / {t('inviteCodeLabel')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('enter8digit')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm uppercase"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/10 transition-all flex items-center gap-2"
                >
                  {modalLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('joinGroup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
