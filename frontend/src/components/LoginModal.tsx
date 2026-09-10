import React, { useState } from 'react';
import { X, Mail, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authApi.login(email, password);
      if (res.success) {
        localStorage.setItem('reachinbox_token', res.data.token);
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoName: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authApi.demoLogin(demoEmail, demoName);
      if (res.success) {
        localStorage.setItem('reachinbox_token', res.data.token);
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 border border-amber-500/20 flex items-center justify-center text-neutral-950 shadow-sm">
              <Mail className="w-4 h-4 text-neutral-950" />
            </div>
            <span className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              ReachInbox Access
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition border border-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-white">
          <div className="text-center">
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
              Sign In to Dashboard
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              Production-grade distributed email scheduler with BullMQ, Redis, and Ethereal SMTP
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@reachinbox.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none transition font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none transition font-medium shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-renault-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 rounded-lg"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              Or 1-Click Evaluator Access
            </span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          {/* Evaluator Profiles */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('mitrajit@reachinbox.ai', 'Mitrajit (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-50 hover:bg-amber-50 hover:border-amber-300 border border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-neutral-950 transition group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Continue as Evaluator: Mitrajit</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-950 group-hover:translate-x-1 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('yadav036@reachinbox.ai', 'Yadav036 (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-50 hover:bg-amber-50 hover:border-amber-300 border border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-neutral-950 transition group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Continue as Evaluator: Yadav036</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-950 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
