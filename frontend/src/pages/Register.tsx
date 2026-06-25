import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, password, fullName);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data || t('Registration failed. Please check inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 px-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse delay-75" />

      {/* Floating Utilities */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Language */}
        <div className="relative group">
          <button className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase">{language}</span>
          </button>
          <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-1">
              <button onClick={() => setLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-slate-755 hover:bg-slate-100 dark:hover:bg-slate-750 font-medium">English</button>
              <button onClick={() => setLanguage('fr')} className="w-full text-left px-4 py-2 text-sm text-slate-755 hover:bg-slate-100 dark:hover:bg-slate-750 font-medium">Français</button>
              <button onClick={() => setLanguage('ar')} className="w-full text-left px-4 py-2 text-sm text-slate-755 hover:bg-slate-100 dark:hover:bg-slate-750 font-medium font-arabic">العربية</button>
            </div>
          </div>
        </div>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-slate-905/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-8 rounded-3xl shadow-2xl relative z-10 my-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-primary-500/20">
            W
          </div>
          <h1 className="mt-4 font-extrabold text-3xl tracking-tight bg-gradient-to-r from-primary-600 to-emerald-500 bg-clip-text text-transparent">
            Watch Guard
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-450 text-sm">
            {t('signUp')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
              {t('fullName')}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
              placeholder="Sara Bennani"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
              {t('username')}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
              placeholder="sara_b"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
              placeholder="sara@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1">
              {t('password')}
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-550 hover:from-primary-700 hover:to-primary-600 text-white font-semibold text-sm shadow-lg shadow-primary-600/25 hover:shadow-primary-600/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t('register')
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-450 font-medium">
          {t('hasAccount')}{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};
