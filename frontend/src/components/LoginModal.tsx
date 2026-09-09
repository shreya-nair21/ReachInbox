import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { X, Mail, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#000000] border border-white/20 rounded-[2px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#ffed00] flex items-center justify-center text-black">
              <Mail className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-black text-white uppercase tracking-wider">
              ReachInbox Access
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Sign In to Dashboard
            </h3>
            <p className="text-xs text-[#8a8a8a] mt-1">
              Production-grade distributed email scheduler with BullMQ, Redis, and Ethereal SMTP
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[2px] bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Real Google OAuth Button */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#8a8a8a] text-center uppercase tracking-wider">
              Google OAuth Authentication (Required)
            </label>
            <div className="flex justify-center pt-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg('Google OAuth login failed or cancelled.')}
                useOneTap={false}
                theme="filled_black"
                shape="rectangular"
                size="large"
              />
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#8a8a8a] font-bold uppercase tracking-wider">
              Or Rapid Evaluator Access
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Evaluator Profiles */}
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('mitrajit@reachinbox.ai', 'Mitrajit (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[2px] bg-[#111111] hover:bg-[#1a1a1a] border border-white/15 hover:border-[#ffed00] text-xs font-bold uppercase tracking-wider text-white transition group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#ffed00]" />
                <span>Continue as Evaluator: Mitrajit</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8a8a8a] group-hover:text-[#ffed00] group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => handleDemoLogin('yadav036@reachinbox.ai', 'Yadav036 (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[2px] bg-[#111111] hover:bg-[#1a1a1a] border border-white/15 hover:border-[#ffed00] text-xs font-bold uppercase tracking-wider text-white transition group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#ffed00]" />
                <span>Continue as Evaluator: Yadav036</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8a8a8a] group-hover:text-[#ffed00] group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
