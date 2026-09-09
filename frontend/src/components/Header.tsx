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
    <header className="border-b border-black bg-[#ffffff] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Renault Geometric Rhombus aesthetic on White */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ffed00] border border-black flex items-center justify-center rounded-[2px]">
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
              <span className="text-base font-black tracking-tight text-black uppercase font-sans">
                ReachInbox
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#ffed00] text-black border border-black rounded-[2px] uppercase tracking-wider">
                Scheduler
              </span>
            </div>
            <p className="text-[10px] text-[#666666] tracking-wider uppercase hidden sm:block font-semibold">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-bold text-black bg-[#ffffff] hover:bg-[#ffed00] border border-black transition uppercase tracking-wider shadow-sm"
            title="Open Live BullMQ Queue Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-black" />
            <span className="hidden md:inline">BullMQ Queues</span>
            <ExternalLink className="w-3 h-3 text-black/60" />
          </a>

          {/* Slack Integration Button */}
          <button
            onClick={onOpenSlackModal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[2px] text-xs font-bold transition uppercase tracking-wider border border-black shadow-sm ${
              slackConnected
                ? 'bg-[#ffed00] text-black hover:bg-[#e6d200]'
                : 'bg-[#ffffff] text-black hover:bg-[#ffed00]'
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
            <div className="flex items-center gap-3 pl-2 border-l border-black/20">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name || user.email
                    )}&background=ffed00&color=000`
                  }
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-[2px] border border-black object-cover"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-black leading-tight">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-[#666666] truncate max-w-[130px] font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-[2px] text-black/60 hover:text-black hover:bg-black/5 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="btn-renault-primary px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
