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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#ffffff] border-2 border-black rounded-[2px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-[#f7f7f7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#ffed00] border border-black flex items-center justify-center text-black">
              <Mail className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-black text-black uppercase tracking-wider">
              ReachInbox Access
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-black hover:bg-black/10 transition border border-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-white">
          <div className="text-center">
            <h3 className="text-lg font-black text-black uppercase tracking-tight">
              Sign In to Dashboard
            </h3>
            <p className="text-xs text-[#666666] mt-1 font-medium">
              Production-grade distributed email scheduler with BullMQ, Redis, and Ethereal SMTP
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[2px] bg-rose-50 border border-rose-600 text-rose-700 text-xs font-bold uppercase">
              {errorMsg}
            </div>
          )}

          {/* Real Google OAuth Button */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#666666] text-center uppercase tracking-wider">
              Google OAuth Authentication
            </label>
            <div className="flex justify-center pt-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg('Google OAuth login failed or cancelled.')}
                useOneTap={false}
                shape="rectangular"
                size="large"
              />
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-black/20"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#666666] font-black uppercase tracking-wider">
              Or Rapid Evaluator Access
            </span>
            <div className="flex-grow border-t border-black/20"></div>
          </div>

          {/* Evaluator Profiles */}
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('mitrajit@reachinbox.ai', 'Mitrajit (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[2px] bg-white hover:bg-[#fffde6] border-2 border-black text-xs font-black uppercase tracking-wider text-black transition group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Continue as Evaluator: Mitrajit</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => handleDemoLogin('yadav036@reachinbox.ai', 'Yadav036 (Evaluator)')}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[2px] bg-white hover:bg-[#fffde6] border-2 border-black text-xs font-black uppercase tracking-wider text-black transition group shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Continue as Evaluator: Yadav036</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
