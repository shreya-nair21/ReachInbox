import React, { useState } from 'react';
import {
  X,
  MessageSquare,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-neutral-200/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 border border-amber-500/20 flex items-center justify-center text-neutral-950 shadow-sm">
              <MessageSquare className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wider">
                Slack Alerting System
              </h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold">
                Live Rate-Limit Incident Alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition border border-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-white">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* Current Status */}
          <div className="p-4 rounded-xl bg-neutral-50/60 border border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-neutral-300'
                }`}
              ></div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  {connected ? 'Slack Connected' : 'Slack Not Connected'}
                </p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5 font-medium">
                  {connected
                    ? `Channel: ${details?.channel || '#general'} (${
                        details?.teamName || 'Workspace'
                      })`
                    : 'Alerts skipped gracefully until connected'}
                </p>
              </div>
            </div>

            {connected && (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition border border-neutral-200 hover:border-rose-200"
                title="Disconnect Slack"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {connected ? (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-neutral-600 font-medium">
                When any sender reaches their hourly sending limit, an incident card will be
                dispatched to your Slack channel with rescheduling window telemetry.
              </p>
              <button
                onClick={handleTestAlert}
                disabled={loading}
                className="btn-renault-primary w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider shadow-sm rounded-lg"
              >
                <Send className="w-3.5 h-3.5 text-neutral-950" />
                <span>Send Live Rate-Limit Test Alert to Slack</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 block mb-2 uppercase tracking-wider">
                  Option 1: Real Slack OAuth 2.0 Flow
                </span>
                <button
                  type="button"
                  onClick={handleOAuthConnect}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4A154B] hover:bg-[#3f1240] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm border border-neutral-200/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Authorize with Slack OAuth</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Or Direct Webhook
                </span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              <form onSubmit={handleSaveWebhook} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Slack Incoming Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none font-mono placeholder:text-neutral-400 shadow-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Channel (e.g. #reachinbox-alerts)"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="flex-1 bg-white border border-neutral-200 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/5 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none font-medium shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading || !webhookUrl.trim()}
                    className="btn-renault-primary px-5 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40 shadow-sm rounded-lg"
                  >
                    Save
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
