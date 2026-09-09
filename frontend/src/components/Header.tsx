import React from 'react';
import { LogOut, Activity, MessageSquare, ExternalLink, ShieldCheck, Mail } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenSlackModal: () => void;
  onOpenLoginModal: () => void;
  slackConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenSlackModal,
  onOpenLoginModal,
  slackConnected,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20 border border-white/10">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                ReachInbox
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full uppercase tracking-wider">
                Scheduler
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              High-Throughput Distributed Email Engine
            </p>
          </div>
        </div>

        {/* Actions & User Section */}
        <div className="flex items-center gap-3">
          {/* BullMQ Live Dashboard Link */}
          <a
            href="/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
            title="Open Live BullMQ Queue Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">BullMQ Dashboard</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Slack Integration Button */}
          <button
            onClick={onOpenSlackModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              slackConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {slackConnected ? 'Slack Connected' : 'Connect Slack'}
            </span>
            {slackConnected && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name || user.email
                    )}&background=6366f1&color=fff`
                  }
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-slate-200 leading-tight">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
