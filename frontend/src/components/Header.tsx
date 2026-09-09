import React from 'react';
import { LogOut, Activity, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
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
    <header className="border-b border-white/10 bg-[#000000] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Renault Geometric Rhombus aesthetic */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ffed00] flex items-center justify-center rounded-[2px] shadow-sm">
            {/* Geometric Rhombus / Diamond */}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-black fill-current stroke-black stroke-[0.5]"
            >
              <polygon points="12,2 21,12 12,22 3,12" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <polygon points="12,6 17,12 12,18 7,12" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white uppercase font-sans">
                ReachInbox
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#ffed00] text-black rounded-[2px] uppercase tracking-wider">
                Scheduler
              </span>
            </div>
            <p className="text-[10px] text-[#8a8a8a] tracking-wider uppercase hidden sm:block font-medium">
              High-Throughput Distributed Email Engine
            </p>
          </div>
        </div>

        {/* Actions & User Section */}
        <div className="flex items-center gap-2.5">
          {/* BullMQ Live Dashboard Link */}
          <a
            href="/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-bold text-white bg-[#111111] hover:bg-[#1f1f1f] border border-white/15 hover:border-[#ffed00] hover:text-[#ffed00] transition"
            title="Open Live BullMQ Queue Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-[#ffed00]" />
            <span className="hidden md:inline uppercase tracking-wider">BullMQ Queues</span>
            <ExternalLink className="w-3 h-3 text-white/50" />
          </a>

          {/* Slack Integration Button */}
          <button
            onClick={onOpenSlackModal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-bold transition uppercase tracking-wider ${
              slackConnected
                ? 'bg-[#ffed00] text-black hover:bg-[#e6d200]'
                : 'bg-[#111111] text-white border border-white/15 hover:border-white/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {slackConnected ? 'Slack Active' : 'Connect Slack'}
            </span>
            {slackConnected && <ShieldCheck className="w-3.5 h-3.5 text-black" />}
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/15">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name || user.email
                    )}&background=ffed00&color=000`
                  }
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-[2px] border border-white/20 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-[#8a8a8a] truncate max-w-[130px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-[2px] text-white/60 hover:text-white hover:bg-white/10 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-4 py-2 rounded-[2px] text-xs font-bold bg-[#ffed00] hover:bg-[#e6d200] text-black uppercase tracking-wider transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
