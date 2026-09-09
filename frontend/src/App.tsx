import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  CalendarClock,
  Send,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ScheduledTable } from './components/ScheduledTable';
import { SentTable } from './components/SentTable';
import { ComposeModal } from './components/ComposeModal';
import { SlackModal } from './components/SlackModal';
import { LoginModal } from './components/LoginModal';
import { authApi, emailApi, slackApi } from './services/api';
import { DashboardStats, EmailSchedule, User, ComposeEmailPayload } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

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
    setBannerMsg({ type: 'success', text: 'You have been logged out.' });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenSlackModal={() => setIsSlackOpen(true)}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        slackConnected={slackConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Alert */}
        {bannerMsg && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              bannerMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span>{bannerMsg.text}</span>
            <button
              onClick={() => setBannerMsg(null)}
              className="text-slate-400 hover:text-slate-200 transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Telemetry & Stats Bar */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* Dashboard Action Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'scheduled' && !searchQuery
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Scheduled Emails</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-black/20">
                {stats?.scheduled ?? 0}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sent');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'sent' && !searchQuery
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent Emails</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-black/20">
                {stats?.sent ?? 0}
              </span>
            </button>
          </div>

          {/* Search Bar & Primary Compose Button */}
          <div className="flex items-center gap-3">
            {/* Search Input (Elasticsearch backend) */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, recipient, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-brand-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition"
              />
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 text-brand-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Primary Compose New Email Button */}
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Compose New Email</span>
            </button>
          </div>
        </div>

        {/* Search Mode or Tab Tables */}
        {searchQuery ? (
          /* Search Results View */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span>
                  Found <strong>{searchResults.length}</strong> result
                  {searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
                </span>
                {searchSource && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-400 border border-slate-700">
                    Engine: {searchSource === 'elasticsearch' ? 'Elasticsearch' : 'SQL Fallback'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-brand-400 hover:text-brand-300 font-medium"
              >
                Clear Search
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
          /* Scheduled Tab */
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
          /* Sent Tab */
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
