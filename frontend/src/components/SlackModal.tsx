import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  ShieldCheck,
  Send,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { slackApi } from '../services/api';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
  connected: boolean;
  details?: { id: string; teamName: string | null; channel: string | null } | null;
  onRefreshStatus: () => void;
}

export const SlackModal: React.FC<SlackModalProps> = ({
  isOpen,
  onClose,
  connected,
  details,
  onRefreshStatus,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('#general');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthConnect = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await slackApi.getAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate Slack OAuth link.');
      setLoading(false);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      await slackApi.setWebhook(webhookUrl.trim(), channelName.trim());
      await onRefreshStatus();
      setTestStatus('Webhook saved and active!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save Slack webhook.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setTestStatus(null);
      const res = await slackApi.testNotification();
      setTestStatus(res.message || 'Alert dispatched to your Slack channel!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send test alert.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await slackApi.disconnect();
      await onRefreshStatus();
      setTestStatus(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to disconnect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Slack Integration</h3>
              <p className="text-xs text-slate-400">
                Instant rate-limit alerts sent to your Slack channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* Current Status */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'
                }`}
              ></div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {connected ? 'Slack is Connected' : 'Slack Not Connected'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {connected
                    ? `Alerting channel: ${details?.channel || '#general'} (${
                        details?.teamName || 'Workspace'
                      })`
                    : 'Rate limit hits will not notify until connected'}
                </p>
              </div>
            </div>

            {connected && (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Disconnect Slack"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {connected ? (
            /* Connected Actions */
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-300">
                Whenever a sender account hits its hourly sending limit, a rich warning alert will
                be delivered directly to your Slack channel with rescheduling info.
              </p>
              <button
                onClick={handleTestAlert}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send Live Test Rate-Limit Alert to Slack</span>
              </button>
            </div>
          ) : (
            /* Connection Options */
            <div className="space-y-4">
              {/* Option A: Real Slack OAuth */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Option 1: Connect via Slack OAuth Flow
                </span>
                <button
                  type="button"
                  onClick={handleOAuthConnect}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4A154B] hover:bg-[#3f1240] text-white text-xs font-semibold shadow-md transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Authorize with Slack OAuth</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium uppercase">
                  Or Test Direct Webhook
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Option B: Manual Webhook URL */}
              <form onSubmit={handleSaveWebhook} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Slack Incoming Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Channel name (e.g. #reachinbox-alerts)"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !webhookUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition disabled:opacity-40"
                  >
                    Save Webhook
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
