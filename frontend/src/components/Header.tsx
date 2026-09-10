import React from 'react';
import { LogOut, Activity, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenSlackModal: () => void;
  onOpenLoginModal: () => void;
  onNavigateToLanding?: () => void;
  slackConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenSlackModal,
  onOpenLoginModal,
  onNavigateToLanding,
  slackConnected,
}) => {
  return (
    <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={onNavigateToLanding}
          className={`flex items-center gap-3 ${onNavigateToLanding ? 'cursor-pointer group' : ''}`}
          title={onNavigateToLanding ? 'Return to Landing Page' : undefined}
        >
          <div className="w-9 h-9 bg-amber-400 border border-amber-500/20 flex items-center justify-center rounded-lg transition group-hover:scale-105 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-neutral-950 fill-current stroke-neutral-950 stroke-[0.5]"
            >
              <polygon points="12,2 21,12 12,22 3,12" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <polygon points="12,6 17,12 12,18 7,12" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-neutral-950 uppercase font-sans">
                ReachInbox
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 rounded-md uppercase tracking-wider">
                Scheduler
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 tracking-wider uppercase hidden sm:block font-semibold">
              High-Throughput Distributed Email Engine
            </p>
          </div>
        </div>

        {/* Actions & User Section */}
        <div className="flex items-center gap-2.5">
          {/* Back to Landing Page Link */}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition shadow-sm"
              title="Return to Landing Page & Sign In / Sign Up"
            >
              Landing Page
            </button>
          )}

          {/* BullMQ Live Dashboard Link */}
          <a
            href="/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 transition uppercase tracking-wider shadow-sm"
            title="Open Live BullMQ Queue Monitor"
          >
            <Activity className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden md:inline">BullMQ Queues</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </a>

          {/* Slack Integration Button */}
          <button
            onClick={onOpenSlackModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase tracking-wider border shadow-sm ${
              slackConnected
                ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200/80'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {slackConnected ? 'Slack Active' : 'Connect Slack'}
            </span>
            {slackConnected && <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />}
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-neutral-200">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name || user.email
                    )}&background=ffed00&color=000`
                  }
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full border border-neutral-200 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-neutral-900 leading-tight">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate max-w-[130px] font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="btn-renault-primary px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
