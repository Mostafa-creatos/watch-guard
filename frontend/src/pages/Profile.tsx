import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Layout } from '../components/Layout';
import { Check, User, Mail, Shield, Settings, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { t, language, setLanguage, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      await updateProfile(fullName);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('profile')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal details, language preferences, and visual settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-500" />
              Account Settings
            </h3>

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Profile updated successfully!
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-4' : 'left-4'} flex items-center text-slate-400`}>
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    className={`w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm ${
                      isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
                    }`}
                    placeholder="Sara Bennani"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  {t('username')}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-4' : 'left-4'} flex items-center text-slate-400`}>
                    <Shield className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    disabled
                    className={`w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/70 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium text-sm ${
                      isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
                    }`}
                    value={user?.username || ''}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  {t('email')}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-4' : 'left-4'} flex items-center text-slate-400`}>
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    disabled
                    className={`w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/70 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium text-sm ${
                      isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
                    }`}
                    value={user?.email || ''}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-550 hover:from-primary-700 hover:to-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t('save')
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Preferences Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                Preferences
              </h3>

              {/* Language Selection */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  UI Language
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['en', 'fr', 'ar'] as const).map((lang) => {
                    const isSelected = language === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/25'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {lang === 'en' && 'English'}
                        {lang === 'fr' && 'Français'}
                        {lang === 'ar' && 'العربية'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  App Theme
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={toggleTheme}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      theme === 'light'
                        ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-400 dark:text-slate-550 block">Watch Guard v1.0.0</span>
              <span className="text-xs text-slate-400 dark:text-slate-550 block mt-1">Default Currency: MAD (Moroccan Dirham)</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
