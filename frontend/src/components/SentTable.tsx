import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { EmailSchedule } from '../types';

interface SentTableProps {
  emails: EmailSchedule[];
  loading: boolean;
  onRefresh: () => void;
}

export const SentTable: React.FC<SentTableProps> = ({ emails, loading, onRefresh }) => {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Sent History</h3>
          <p className="text-xs text-slate-400">
            Delivered emails via Ethereal fake SMTP server with web preview URLs
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Subject & Preview</th>
              <th className="px-6 py-3.5">Delivered At</th>
              <th className="px-6 py-3.5">Sender</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Ethereal Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && emails.length === 0 ? (
              // Loading Skeletons
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-800 rounded w-36"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-800 rounded w-48 mb-1"></div>
                    <div className="h-3 bg-slate-800/50 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-800 rounded w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-800 rounded w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-slate-800 rounded-full w-20"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-7 bg-slate-800 rounded w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                      <Send className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200">No Sent Emails Yet</h4>
                    <p className="text-xs text-slate-400 mt-1 text-center">
                      Emails dispatched by BullMQ workers will appear here with live preview links to
                      Ethereal Mailbox.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const sentDate = email.sentAt ? new Date(email.sentAt) : new Date(email.updatedAt);
                const isSent = email.status === 'SENT';

                return (
                  <tr key={email.id} className="hover:bg-slate-800/40 transition group">
                    {/* Recipient */}
                    <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">
                      {email.recipientEmail}
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-slate-200 truncate">{email.subject}</div>
                      <div className="text-xs text-slate-400 truncate">{email.body}</div>
                      {email.errorMessage && (
                        <div className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 truncate">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{email.errorMessage}</span>
                        </div>
                      )}
                    </td>

                    {/* Sent Time */}
                    <td className="px-6 py-4 text-xs text-slate-300 whitespace-nowrap">
                      {format(sentDate, 'MMM d, yyyy · hh:mm:ss a')}
                    </td>

                    {/* Sender */}
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {email.senderEmail}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>

                    {/* Ethereal Preview Button */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {email.etherealPreviewUrl ? (
                        <a
                          href={email.etherealPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition border border-brand-500/20 group-hover:border-brand-500/40"
                          title="Open live rendered email in Ethereal web inbox"
                        >
                          <span>Preview Email</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No preview</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
