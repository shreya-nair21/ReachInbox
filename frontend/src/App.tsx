import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  CalendarClock,
  Send,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ScheduledTable } from './components/ScheduledTable';
import { SentTable } from './components/SentTable';
import { ComposeModal } from './components/ComposeModal';
import { SlackModal } from './components/SlackModal';
import { LoginModal } from './components/LoginModal';
import { LandingPage } from './components/LandingPage';
import { authApi, emailApi, slackApi } from './services/api';
import { DashboardStats, EmailSchedule, User, ComposeEmailPayload } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // View Routing: 'landing' | 'dashboard'
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'dashboard') return 'dashboard';
    return localStorage.getItem('reachinbox_token') ? 'dashboard' : 'landing';
  });

  // Tabs: 'scheduled' | 'sent'
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');

  // Email Tables State
  const [scheduledEmails, setScheduledEmails] = useState<EmailSchedule[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailSchedule[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Search State (Elasticsearch)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmailSchedule[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSource, setSearchSource] = useState<string | null>(null);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSlackOpen, setIsSlackOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Slack Status
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackDetails, setSlackDetails] = useState<any>(null);

  // Toast / Banner notification
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Check URL parameters for OAuth returns on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack_connected') === 'true') {
      setBannerMsg({
        type: 'success',
        text: 'Slack successfully connected! Rate limit alerts will now post to your Slack channel.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('slack_error')) {
      setBannerMsg({
        type: 'error',
        text: `Slack OAuth error: ${params.get('slack_error')}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch Current User
  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setSlackConnected(!!res.data.user.slackConnected);
        setSlackDetails(res.data.user.slackDetails);
      }
    } catch (err) {
      console.warn('User not authenticated, showing demo state');
    }
  }, []);

  // Fetch Dashboard Stats & Queue Metrics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await emailApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Emails
  const fetchEmails = useCallback(async () => {
    try {
      setTableLoading(true);
      if (activeTab === 'scheduled') {
        const res = await emailApi.getScheduled(1, 50);
        if (res.success) {
          setScheduledEmails(res.data.emails);
        }
      } else {
        const res = await emailApi.getSent(1, 50);
        if (res.success) {
          setSentEmails(res.data.emails);
        }
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setTableLoading(false);
    }
  }, [activeTab]);

  // Handle Search via Elasticsearch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchSource(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await emailApi.search(searchQuery.trim());
        if (res.success) {
          setSearchResults(res.data.emails);
          setSearchSource(res.data.source);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial Data Load
  useEffect(() => {
    fetchUser();
    fetchStats();
    fetchEmails();
  }, [fetchUser, fetchStats, fetchEmails]);

  // Periodic Polling (every 6 seconds) for real-time queue synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchEmails();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchEmails]);

  // Refresh Slack Status
  const refreshSlackStatus = async () => {
    try {
      const res = await slackApi.getStatus();
      if (res.success) {
        setSlackConnected(res.data.connected);
        setSlackDetails(res.data.integration || null);
      }
    } catch (err) {
      console.error('Failed to refresh Slack status:', err);
    }
  };

  // Schedule Emails Handler
  const handleScheduleEmails = async (payload: ComposeEmailPayload) => {
    const res = await emailApi.schedule(payload);
    if (res.success) {
      setBannerMsg({
        type: 'success',
        text: `Successfully queued ${res.data.totalScheduled} email(s) in BullMQ!`,
      });
      fetchStats();
      fetchEmails();
    }
  };

  // Cancel Email Handler
  const handleCancelEmail = async (emailId: string) => {
    try {
      await emailApi.cancel(emailId);
      setBannerMsg({ type: 'success', text: 'Scheduled email cancelled.' });
      fetchStats();
      fetchEmails();
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel email.',
      });
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('reachinbox_token');
    setUser(null);
    setCurrentView('landing');
    setBannerMsg({ type: 'success', text: 'You have been logged out.' });
  };

  // If in Landing View, render the Dedicated Renault Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          setCurrentView('dashboard');
          setBannerMsg({
            type: 'success',
            text: `Welcome, ${loggedUser.name || loggedUser.email}! You are now in the live console.`,
          });
          fetchStats();
          fetchEmails();
        }}
        onExploreDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenSlackModal={() => setIsSlackOpen(true)}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onNavigateToLanding={() => setCurrentView('landing')}
        slackConnected={slackConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Alert */}
        {bannerMsg && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              bannerMsg.type === 'success'
                ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
                : 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm'
            }`}
          >
            <span>{bannerMsg.text}</span>
            <button
              onClick={() => setBannerMsg(null)}
              className="text-neutral-400 hover:text-neutral-700 transition text-sm font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Telemetry & Stats Bar */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* Dashboard Action Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Tabs - Modern Clean Switching on Soft Canvas */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white border border-neutral-200/90 rounded-xl shadow-sm">
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'scheduled' && !searchQuery
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Scheduled</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                activeTab === 'scheduled' && !searchQuery ? 'bg-neutral-950 text-amber-300' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {stats?.scheduled ?? 0}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sent');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'sent' && !searchQuery
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent History</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                activeTab === 'sent' && !searchQuery ? 'bg-neutral-950 text-amber-300' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {stats?.sent ?? 0}
              </span>
            </button>
          </div>

          {/* Search Bar & Primary Compose Button */}
          <div className="flex items-center gap-3">
            {/* Search Input (Elasticsearch backend) */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, lead, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition font-sans font-medium shadow-sm"
              />
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 text-neutral-900 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Primary Compose New Email Button */}
            <button
              onClick={() => setIsComposeOpen(true)}
              className="btn-renault-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Compose Email</span>
            </button>
          </div>
        </div>

        {/* Search Mode or Tab Tables */}
        {searchQuery ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-700 px-1 uppercase font-bold">
              <div className="flex items-center gap-2">
                <span>
                  Found <strong>{searchResults.length}</strong> record
                  {searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
                </span>
                {searchSource && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase font-bold">
                    Engine: {searchSource === 'elasticsearch' ? 'Elasticsearch' : 'SQL Fallback'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-600 hover:text-neutral-950 underline font-bold uppercase tracking-wider"
              >
                Clear
              </button>
            </div>
            {searchResults.length > 0 && searchResults[0].status === 'SENT' ? (
              <SentTable
                emails={searchResults}
                loading={isSearching}
                onRefresh={() => fetchEmails()}
              />
            ) : (
              <ScheduledTable
                emails={searchResults}
                loading={isSearching}
                onCancel={handleCancelEmail}
                onRefresh={() => fetchEmails()}
              />
            )}
          </div>
        ) : activeTab === 'scheduled' ? (
          <ScheduledTable
            emails={scheduledEmails}
            loading={tableLoading}
            onCancel={handleCancelEmail}
            onRefresh={() => {
              fetchStats();
              fetchEmails();
            }}
          />
        ) : (
          <SentTable
            emails={sentEmails}
            loading={tableLoading}
            onRefresh={() => {
              fetchStats();
              fetchEmails();
            }}
          />
        )}
      </main>

      {/* Dashboard Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800">ReachInbox Engine</span>
            <span>•</span>
            <span>BullMQ Concurrency: 5</span>
            <span>•</span>
            <span>Redis 8.10.1 :6380</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/queues"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-600 hover:text-neutral-900 transition flex items-center gap-1 font-medium"
            >
              <span>BullMQ Monitor</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
            <span>© {new Date().getFullYear()} ReachInbox</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSchedule={handleScheduleEmails}
      />

      <SlackModal
        isOpen={isSlackOpen}
        onClose={() => setIsSlackOpen(false)}
        connected={slackConnected}
        details={slackDetails}
        onRefreshStatus={refreshSlackStatus}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          setBannerMsg({
            type: 'success',
            text: `Welcome, ${loggedUser.name || loggedUser.email}!`,
          });
          fetchStats();
          fetchEmails();
        }}
      />
    </div>
  );
};

export default App;
