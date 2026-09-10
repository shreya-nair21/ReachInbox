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
    <div className="bg-white border border-neutral-200/90 rounded-xl overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Sent Archive</h3>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide mt-0.5 font-semibold">
            Dispatched via Ethereal fake SMTP server with live rendered browser previews
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition border border-neutral-200"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neutral-900' : ''}`} />
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-900">
          <thead className="bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Subject & Preview</th>
              <th className="px-6 py-3.5">Delivered At</th>
              <th className="px-6 py-3.5">Sender</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Ethereal Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {loading && emails.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-100 rounded-md w-36"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-100 rounded-md w-48 mb-1"></div>
                    <div className="h-3 bg-neutral-50 rounded-md w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-100 rounded-md w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-neutral-100 rounded-md w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-neutral-100 rounded-md w-16"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-7 bg-neutral-100 rounded-md w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-500 mb-3 shadow-sm">
                      <Send className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Archive Empty</h4>
                    <p className="text-xs text-neutral-500 mt-1 text-center font-medium">
                      Emails dispatched by BullMQ workers will appear here with live preview links.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const sentDate = email.sentAt ? new Date(email.sentAt) : new Date(email.updatedAt);
                const isSent = email.status === 'SENT';

                return (
                  <tr key={email.id} className="hover:bg-neutral-50/60 transition group">
                    <td className="px-6 py-4 font-bold text-neutral-900 whitespace-nowrap">
                      {email.recipientEmail}
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-neutral-900 truncate">{email.subject}</div>
                      <div className="text-xs text-neutral-500 truncate font-medium">{email.body}</div>
                      {email.errorMessage && (
                        <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 truncate font-semibold">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{email.errorMessage}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-neutral-900 font-semibold whitespace-nowrap">
                      {format(sentDate, 'MMM d, yyyy · hh:mm:ss a')}
                    </td>

                    <td className="px-6 py-4 text-xs text-neutral-500 font-medium whitespace-nowrap">
                      {email.senderEmail}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {email.etherealPreviewUrl ? (
                        <a
                          href={email.etherealPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 hover:bg-amber-400 hover:text-neutral-950 border border-neutral-200 rounded-lg transition shadow-sm"
                          title="Open live rendered email in Ethereal web inbox"
                        >
                          <span>Preview</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No preview</span>
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
