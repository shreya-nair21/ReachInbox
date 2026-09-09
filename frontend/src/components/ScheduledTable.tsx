import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarClock, RefreshCw, Clock } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#ffed00] text-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
            Sending
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#181818] text-[#ffed00] border border-[#ffed00]/40 uppercase tracking-wider"
            title={`Hourly rate limit exceeded. Rescheduled ${rescheduleCount} time(s).`}
          >
            <Clock className="w-3 h-3" />
            Throttled ({rescheduleCount}x)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-white/10 text-white border border-white/15 uppercase tracking-wider">
            <CalendarClock className="w-3 h-3 text-[#ffed00]" />
            Queued
          </span>
        );
    }
  };

  return (
    <div className="renault-panel overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Scheduled Queue</h3>
          <p className="text-[11px] text-[#8a8a8a] uppercase tracking-wide mt-0.5">
            Jobs queued in BullMQ waiting for target delivery window
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-[2px] text-white/60 hover:text-[#ffed00] hover:bg-white/5 transition"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#ffed00]' : ''}`} />
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-[#111111] text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] border-b border-white/10">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Subject & Preview</th>
              <th className="px-6 py-3.5">Scheduled Delivery</th>
              <th className="px-6 py-3.5">Sender</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {loading && emails.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/10 rounded-[2px] w-36"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/10 rounded-[2px] w-48 mb-1"></div>
                    <div className="h-3 bg-white/5 rounded-[2px] w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/10 rounded-[2px] w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-white/10 rounded-[2px] w-28"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-white/10 rounded-[2px] w-16"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-6 bg-white/10 rounded-[2px] w-14 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-[2px] bg-[#111111] border border-white/15 flex items-center justify-center text-[#ffed00] mb-3">
                      <CalendarClock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Queue Empty</h4>
                    <p className="text-xs text-[#8a8a8a] mt-1 text-center">
                      No emails currently scheduled. Use "Compose New Email" to schedule a campaign.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const schedDate = new Date(email.scheduledAt);
                const isPast = schedDate.getTime() <= Date.now();

                return (
                  <tr key={email.id} className="hover:bg-[#111111] transition group">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {email.recipientEmail}
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-white truncate">{email.subject}</div>
                      <div className="text-xs text-[#8a8a8a] truncate">{email.body}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-white">
                        {format(schedDate, 'MMM d, yyyy · hh:mm:ss a')}
                      </div>
                      <div className="text-[10px] text-[#ffed00] font-semibold flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                        <Clock className="w-3 h-3" />
                        {isPast ? 'Executing now' : formatDistanceToNow(schedDate, { addSuffix: true })}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#8a8a8a] whitespace-nowrap">
                      {email.senderEmail}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(email.status, email.rateLimitRescheduleCount)}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onCancel(email.id)}
                        className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-[2px] transition border border-rose-500/20"
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
