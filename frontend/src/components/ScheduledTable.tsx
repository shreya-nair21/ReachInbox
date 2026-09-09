import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarClock, XCircle, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { EmailSchedule } from '../types';

interface ScheduledTableProps {
  emails: EmailSchedule[];
  loading: boolean;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  loading,
  onCancel,
  onRefresh,
}) => {
  const getStatusBadge = (status: string, rescheduleCount: number) => {
    switch (status) {
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Sending...
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20"
            title={`Hourly rate limit exceeded. Rescheduled ${rescheduleCount} time(s).`}
          >
            <Clock className="w-3 h-3" />
            Rate Rescheduled ({rescheduleCount}x)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <CalendarClock className="w-3 h-3" />
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Scheduled Queue</h3>
          <p className="text-xs text-slate-400">
            Emails queued in BullMQ waiting for their scheduled delivery window
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Refresh Queue"
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
              <th className="px-6 py-3.5">Scheduled Delivery</th>
              <th className="px-6 py-3.5">Sender</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
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
                    <div className="h-7 bg-slate-800 rounded w-16 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                      <CalendarClock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200">No Scheduled Emails</h4>
                    <p className="text-xs text-slate-400 mt-1 text-center">
                      Your scheduled queue is currently empty. Click "Compose New Email" to upload
                      leads and schedule a campaign!
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const schedDate = new Date(email.scheduledAt);
                const isPast = schedDate.getTime() <= Date.now();

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
                    </td>

                    {/* Scheduled Delivery */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-200">
                        {format(schedDate, 'MMM d, yyyy · hh:mm:ss a')}
                      </div>
                      <div className="text-[11px] text-brand-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {isPast ? 'Processing shortly' : formatDistanceToNow(schedDate, { addSuffix: true })}
                      </div>
                    </td>

                    {/* Sender */}
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {email.senderEmail}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(email.status, email.rateLimitRescheduleCount)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onCancel(email.id)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500/20"
                        title="Cancel this scheduled send"
                      >
                        Cancel
                      </button>
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
