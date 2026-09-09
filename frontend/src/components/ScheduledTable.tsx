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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-black bg-[#ffed00] text-black border border-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
            Sending
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-black bg-black text-[#ffed00] uppercase tracking-wider"
            title={`Hourly rate limit exceeded. Rescheduled ${rescheduleCount} time(s).`}
          >
            <Clock className="w-3 h-3 text-[#ffed00]" />
            Throttled ({rescheduleCount}x)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#f7f7f7] text-black border border-black/30 uppercase tracking-wider">
            <CalendarClock className="w-3 h-3 text-black" />
            Queued
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-black rounded-[2px] overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-[#f7f7f7]">
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wider">Scheduled Queue</h3>
          <p className="text-[11px] text-[#666666] uppercase tracking-wide mt-0.5 font-semibold">
            Jobs queued in BullMQ waiting for target delivery window
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-[2px] text-black hover:bg-black/10 transition border border-black/20"
          title="Refresh Queue"
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
              <th className="px-6 py-3.5">Scheduled Delivery</th>
              <th className="px-6 py-3.5">Sender</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
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
                    <div className="h-6 bg-black/10 rounded-[2px] w-14 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-[2px] bg-[#f7f7f7] border border-black flex items-center justify-center text-black mb-3">
                      <CalendarClock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-black uppercase tracking-wider">Queue Empty</h4>
                    <p className="text-xs text-[#666666] mt-1 text-center font-medium">
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
                  <tr key={email.id} className="hover:bg-[#fcfcfc] transition group">
                    <td className="px-6 py-4 font-black text-black whitespace-nowrap">
                      {email.recipientEmail}
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-black truncate">{email.subject}</div>
                      <div className="text-xs text-[#666666] truncate font-medium">{email.body}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-black">
                        {format(schedDate, 'MMM d, yyyy · hh:mm:ss a')}
                      </div>
                      <div className="text-[10px] text-[#000000] font-black flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                        <Clock className="w-3 h-3" />
                        {isPast ? 'Executing now' : formatDistanceToNow(schedDate, { addSuffix: true })}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#666666] font-medium whitespace-nowrap">
                      {email.senderEmail}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(email.status, email.rateLimitRescheduleCount)}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onCancel(email.id)}
                        className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-rose-600 hover:text-white hover:bg-rose-600 rounded-[2px] transition border border-rose-600"
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
