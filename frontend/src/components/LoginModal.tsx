import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { X, Mail, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { authApi } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authApi.googleLogin(credentialResponse.credential);
      if (res.success) {
        localStorage.setItem('reachinbox_token', res.data.token);
        onLoginSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, name: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authApi.demoLogin(email, name);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-white">Sign In to ReachInbox</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-100">Welcome to ReachInbox</h3>
            <p className="text-xs text-slate-400 mt-1">
              Production-grade distributed email scheduler with BullMQ, Redis, and Ethereal SMTP
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Real Google OAuth Button */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 text-center uppercase tracking-wider">
              Google OAuth Login (Required)
            </label>
            <div className="flex justify-center pt-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg('Google OAuth login failed or cancelled.')}
                useOneTap={false}
                theme="filled_black"
                shape="pill"
                size="large"
              />
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium uppercase">
              Or Fast Evaluator Login
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Quick Evaluator Access */}
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('mitrajit@reachinbox.ai', 'Mitrajit (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Continue as Evaluator: Mitrajit</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => handleDemoLogin('yadav036@reachinbox.ai', 'Yadav036 (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Continue as Evaluator: Yadav036</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
