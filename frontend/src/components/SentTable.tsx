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
    <div className="bg-white border border-black rounded-[2px] overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-[#f7f7f7]">
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wider">Sent Archive</h3>
          <p className="text-[11px] text-[#666666] uppercase tracking-wide mt-0.5 font-semibold">
            Dispatched via Ethereal fake SMTP server with live rendered browser previews
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-[2px] text-black hover:bg-black/10 transition border border-black/20"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-black' : ''}`} />
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-black">
          <thead className="bg-[#f0f0f0] text-[11px] font-black uppercase tracking-wider text-black border-b border-black">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Subject & Preview</th>
              <th className="px-6 py-3.5">Delivered At</th>
              <th className="px-6 py-3.5">Sender</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Ethereal Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 bg-white">
            {loading && emails.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-black/10 rounded-[2px] w-36"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-black/10 rounded-[2px] w-48 mb-1"></div>
                    <div className="h-3 bg-black/5 rounded-[2px] w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-black/10 rounded-[2px] w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-black/10 rounded-[2px] w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-black/10 rounded-[2px] w-16"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-7 bg-black/10 rounded-[2px] w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-[2px] bg-[#f7f7f7] border border-black flex items-center justify-center text-black mb-3">
                      <Send className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-black uppercase tracking-wider">Archive Empty</h4>
                    <p className="text-xs text-[#666666] mt-1 text-center font-medium">
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
                  <tr key={email.id} className="hover:bg-[#fcfcfc] transition group">
                    <td className="px-6 py-4 font-black text-black whitespace-nowrap">
                      {email.recipientEmail}
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-black truncate">{email.subject}</div>
                      <div className="text-xs text-[#666666] truncate font-medium">{email.body}</div>
                      {email.errorMessage && (
                        <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 truncate font-semibold">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>{email.errorMessage}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-black font-semibold whitespace-nowrap">
                      {format(sentDate, 'MMM d, yyyy · hh:mm:ss a')}
                    </td>

                    <td className="px-6 py-4 text-xs text-[#666666] font-medium whitespace-nowrap">
                      {email.senderEmail}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-[10px] font-black bg-[#ffed00] text-black border border-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[2px] text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
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
                          className="btn-renault-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm"
                          title="Open live rendered email in Ethereal web inbox"
                        >
                          <span>Preview</span>
                          <ExternalLink className="w-3 h-3 text-black" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#999999] italic">No preview</span>
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
