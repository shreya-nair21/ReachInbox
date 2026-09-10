import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ExternalLink,
  Clock,
  Terminal,
} from 'lucide-react';
import { authApi } from '../services/api';
import { User } from '../types';

interface LandingPageProps {
  onLoginSuccess: (user: User, token?: string) => void;
  onExploreDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  onExploreDashboard,
}) => {
  // Auth Tab: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Evaluator One-Click Login
  const handleEvaluatorLogin = async (evalEmail: string, evalName: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await authApi.demoLogin(evalEmail, evalName);
      if (res.success) {
        localStorage.setItem('reachinbox_token', res.data.token);
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Evaluator login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Form Submit (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      let res;
      if (authMode === 'signup') {
        res = await authApi.signup(email, password, name);
      } else {
        res = await authApi.login(email, password);
      }

      if (res.success) {
        localStorage.setItem('reachinbox_token', res.data.token);
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans selection:bg-amber-200 selection:text-neutral-900">
      {/* Top Professional Navigation */}
      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 border border-amber-500/20 flex items-center justify-center rounded-lg shadow-sm">
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

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href="/admin/queues"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 transition uppercase tracking-wider shadow-sm"
              title="View Live BullMQ Queue Dashboard"
            >
              <Activity className="w-3.5 h-3.5 text-neutral-600" />
              <span>BullMQ Board</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero & Auth Split Section */}
      <section className="relative border-b border-neutral-200 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Architecture Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-200/80 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Production-Grade Distributed Job Scheduler</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-950 uppercase tracking-tight leading-[1.08] font-sans">
                Fault-Tolerant <br />
                <span className="bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-lg border border-amber-200/80 inline-block mt-1">
                  Email Dispatch
                </span>{' '}
                Orchestration
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base text-neutral-600 font-medium max-w-xl leading-relaxed">
                Engineered for massive outreach campaigns with <strong>BullMQ + Redis</strong> delayed
                queues (zero cron jobs). Features atomic hourly rate limiting with non-dropping
                rescheduling, Ethereal fake SMTP delivery with live browser previews, and real-time Slack
                incident alerting.
              </p>

              {/* Architectural Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:border-neutral-300 transition">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">Scheduler</div>
                  <div className="text-xs font-black text-neutral-900 uppercase mt-0.5">BullMQ & Redis 8</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">Zero cron jobs</div>
                </div>

                <div className="p-3 bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:border-neutral-300 transition">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">Rate Limiting</div>
                  <div className="text-xs font-black text-neutral-900 uppercase mt-0.5">Sliding Windows</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">Next-hour reschedule</div>
                </div>

                <div className="p-3 bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:border-neutral-300 transition">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">SMTP Testing</div>
                  <div className="text-xs font-black text-neutral-900 uppercase mt-0.5">Ethereal Mail</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">Live web inbox link</div>
                </div>

                <div className="p-3 bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:border-neutral-300 transition">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">Alerting</div>
                  <div className="text-xs font-black text-neutral-900 uppercase mt-0.5">Slack Webhooks</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">Channel & webhook dispatch</div>
                </div>

                <div className="p-3 bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:border-neutral-300 transition">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">Persistence</div>
                  <div className="text-xs font-black text-neutral-900 uppercase mt-0.5">MySQL & Prisma</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">Crash-resilient state</div>
                </div>

                <div className="p-3 bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:border-neutral-300 transition">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">Search Engine</div>
                  <div className="text-xs font-black text-neutral-900 uppercase mt-0.5">Elasticsearch</div>
                  <div className="text-[10px] text-neutral-500 font-medium mt-0.5">Lucene full-text index</div>
                </div>
              </div>

            </div>

            {/* Right Auth Card Column */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xl shadow-neutral-900/5 overflow-hidden">
                {/* Auth Mode Tabs: Sign In / Sign Up */}
                <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50/70">
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMsg(null);
                    }}
                    className={`py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                      authMode === 'signin'
                        ? 'bg-white text-neutral-900 border-b-2 border-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                    }}
                    className={`py-3.5 text-xs font-bold uppercase tracking-wider transition border-l border-neutral-200 ${
                      authMode === 'signup'
                        ? 'bg-white text-neutral-900 border-b-2 border-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Form Container */}
                <div className="p-6 sm:p-7 space-y-5 bg-white">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                      {authMode === 'signin' ? 'Sign In to Dashboard' : 'Create Free Account'}
                    </h2>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      {authMode === 'signin'
                        ? 'Access your distributed BullMQ dispatch pipeline'
                        : 'Start scheduling emails with zero dropped jobs'}
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Email & Password Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Alex Morgan"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none transition font-medium placeholder:text-neutral-400"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="evaluator@reachinbox.ai"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none transition font-medium placeholder:text-neutral-400"
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
                          className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none transition font-medium placeholder:text-neutral-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-renault-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg shadow-sm disabled:opacity-50"
                    >
                      <span>
                        {loading
                          ? 'Authenticating...'
                          : authMode === 'signin'
                          ? 'Sign In to Console'
                          : 'Create Account & Launch'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-950" />
                    </button>
                  </form>

                  {/* Evaluator Quick Access */}
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-center">
                      ⚡ 1-Click Hiring Evaluator Access
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEvaluatorLogin('mitrajit@reachinbox.ai', 'Mitrajit (Evaluator)')}
                        disabled={loading}
                        className="p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-bold uppercase text-neutral-800 flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Mitrajit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEvaluatorLogin('yadav036@reachinbox.ai', 'Yadav036 (Evaluator)')}
                        disabled={loading}
                        className="p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-bold uppercase text-neutral-800 flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Yadav036</span>
                      </button>
                    </div>
                  </div>

                  {/* Guest Bypass */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={onExploreDashboard}
                      className="text-xs font-bold text-neutral-500 hover:text-neutral-900 uppercase tracking-wider underline transition"
                    >
                      Skip Login · Explore Guest Console
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Deep-Dive Grid Section */}
      <section className="border-b border-neutral-200 py-16 bg-[#ffffff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">
              Enterprise Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-sans">
              Distributed System Architecture
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-2">
              Engineered for high-volume outreach with zero dropped jobs, sliding-window rate limit protection, and sub-second queue processing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: BullMQ Delayed Queues */}
            <div className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition">
              <div>
                <div className="w-10 h-10 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                  BullMQ Delayed Queues
                </h3>
                <p className="text-xs text-neutral-600 font-medium mt-2 leading-relaxed">
                  Strictly avoids crontab, node-cron, or agenda. Jobs are pushed into Redis with calculated
                  delay offsets. Persistent across server restarts.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <span className="text-[10px] font-bold uppercase text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/70">
                  Zero Cron Pipeline
                </span>
              </div>
            </div>

            {/* Card 2: Atomic Rate Limiting */}
            <div className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition">
              <div>
                <div className="w-10 h-10 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                  Atomic Rate Limiter
                </h3>
                <p className="text-xs text-neutral-600 font-medium mt-2 leading-relaxed">
                  Redis atomic window counters per sender per hour (`rate_limit:&#123;sender&#125;:&#123;YYYY-MM-DD-HH&#125;`).
                  Exceeded jobs auto-reschedule into the next hour window (+ jitter).
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <span className="text-[10px] font-bold uppercase text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/70">
                  Zero Dropped Jobs
                </span>
              </div>
            </div>

            {/* Card 3: Ethereal Fake SMTP */}
            <div className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition">
              <div>
                <div className="w-10 h-10 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                  Ethereal Fake SMTP
                </h3>
                <p className="text-xs text-neutral-600 font-medium mt-2 leading-relaxed">
                  Worker transmits real RFC MIME emails to Ethereal SMTP test accounts, automatically
                  generating live rendered web URLs for immediate evaluation.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <span className="text-[10px] font-bold uppercase text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/70">
                  Live Preview URLs
                </span>
              </div>
            </div>

            {/* Card 4: Slack Incident Alerting */}
            <div className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition">
              <div>
                <div className="w-10 h-10 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                  Slack Rate-Limit Alerts
                </h3>
                <p className="text-xs text-neutral-600 font-medium mt-2 leading-relaxed">
                  Integrated Slack Webhook subsystem. Automatically alerts the operations
                  team channel the exact second a sender hits their hourly limit.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <span className="text-[10px] font-bold uppercase text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/70">
                  Instant Webhook Bot
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Pipeline Telemetry Visualizer */}
      <section className="border-b border-neutral-200 py-16 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-900 text-amber-400 rounded-lg flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider">
                    Worker Dispatch Engine Telemetry
                  </h3>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold">
                    Real-time BullMQ process loop & rate limit protection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  Worker Concurrency: 5
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Redis 8.10.1 :6380
                </span>
              </div>
            </div>

            {/* Terminal Visualizer */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 font-mono text-xs text-neutral-300 space-y-2 overflow-x-auto shadow-inner">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="text-amber-400 font-bold">INFO</span>
                <span>[2026-09-09T11:06:16Z]</span>
                <span className="text-white font-bold">BullMQ email-dispatch-queue worker online. Concurrency: 5</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="text-amber-400 font-bold">INFO</span>
                <span>[2026-09-09T11:06:22Z]</span>
                <span>[RateLimiter] Window [2026-09-09-11] initialized. Atomic key: rate_limit:growth@outboxlabs.com:2026-09-09-11</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="text-emerald-400 font-bold">DISPATCH</span>
                <span>[2026-09-09T11:06:23Z]</span>
                <span>Sent email to sarah.connor@cyberdyne.org via Ethereal SMTP (2000ms provider cooldown applied)</span>
              </div>
              <div className="flex items-center gap-2 text-rose-300 bg-rose-950/40 p-1.5 rounded-md border border-rose-900/60">
                <span className="text-rose-400 font-black">RATE_LIMIT</span>
                <span>[2026-09-09T11:06:24Z]</span>
                <span>Sender limit (2/hr) reached. Rescheduling 2 job(s) to start of next window: 2026-09-09T12:00:01Z</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="text-purple-400 font-bold">SLACK_ALERT</span>
                <span>[2026-09-09T11:06:24Z]</span>
                <span>Rate-limit incident card posted to #reachinbox-alerts with next delivery time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional SaaS Footer */}
      <footer className="bg-white border-t border-neutral-200/90 pt-16 pb-12 text-neutral-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-neutral-200/80">
            {/* Brand & Overview Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-400 border border-amber-500/20 flex items-center justify-center rounded-lg shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-neutral-950 fill-current stroke-neutral-950 stroke-[0.5]"
                  >
                    <polygon points="12,2 21,12 12,22 3,12" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <polygon points="12,6 17,12 12,18 7,12" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-neutral-950 uppercase font-sans">
                    ReachInbox
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 rounded-md uppercase tracking-wider">
                    Scheduler
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 max-w-sm leading-relaxed font-medium">
                High-throughput distributed email sequencing engine. Powered by BullMQ delayed queues, Redis 8 atomic sliding-window rate limiting, and real-time observability.
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  All Systems Operational
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">v1.0.0-prod</span>
              </div>
            </div>

            {/* Platform Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <button onClick={onExploreDashboard} className="hover:text-neutral-950 transition text-left">
                    Live Dispatch Console
                  </button>
                </li>
                <li>
                  <a
                    href="/admin/queues"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-950 inline-flex items-center gap-1 transition"
                  >
                    Queue Telemetry <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </a>
                </li>
                <li>
                  <button onClick={onExploreDashboard} className="hover:text-neutral-950 transition text-left">
                    Scheduled Pipeline
                  </button>
                </li>
                <li>
                  <button onClick={onExploreDashboard} className="hover:text-neutral-950 transition text-left">
                    Sent Deliverability Archive
                  </button>
                </li>
              </ul>
            </div>

            {/* Architecture Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Architecture</h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-500">
                <li className="hover:text-neutral-900 transition cursor-default">BullMQ + Redis 8</li>
                <li className="hover:text-neutral-900 transition cursor-default">Sliding Window Limiter</li>
                <li className="hover:text-neutral-900 transition cursor-default">Ethereal SMTP Relay</li>
                <li className="hover:text-neutral-900 transition cursor-default">Elasticsearch Engine</li>
                <li className="hover:text-neutral-900 transition cursor-default">Slack Webhook Alerts</li>
              </ul>
            </div>

            {/* Resources & Compliance Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <span className="text-neutral-500 cursor-default">API Documentation</span>
                </li>
                <li>
                  <span className="text-neutral-500 cursor-default">Concurrency Controls</span>
                </li>
                <li>
                  <span className="text-neutral-500 cursor-default">Security & Compliance</span>
                </li>
                <li>
                  <span className="text-neutral-500 cursor-default">Privacy Policy</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-neutral-500">
            <p>© {new Date().getFullYear()} ReachInbox. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-neutral-400">
              <span>Zero-Cron Architecture</span>
              <span>•</span>
              <span>Atomic Rate Limiting</span>
              <span>•</span>
              <span>Real-time BullMQ Telemetry</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
