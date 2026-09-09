import React from 'react';
import { CalendarClock, CheckCircle2, Clock, ShieldAlert, Database, Search } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsBarProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {/* 1. Scheduled */}
      <div className="renault-card p-4 relative overflow-hidden bg-white border border-black hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Scheduled</span>
          <div className="w-6 h-6 bg-[#ffed00] border border-black rounded-[2px] flex items-center justify-center">
            <CalendarClock className="w-3.5 h-3.5 text-black" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-black tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-black/10 animate-pulse rounded-[2px]"></div>
          ) : (
            stats?.scheduled ?? 0
          )}
        </div>
        <p className="text-[10px] text-[#666666] mt-2 uppercase tracking-wide font-semibold">Pending dispatch</p>
      </div>

      {/* 2. Delivered / Sent */}
      <div className="renault-card p-4 relative overflow-hidden bg-white border border-black hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Delivered</span>
          <div className="w-6 h-6 bg-[#ffed00] border border-black rounded-[2px] flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-black tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-black/10 animate-pulse rounded-[2px]"></div>
          ) : (
            stats?.sent ?? 0
          )}
        </div>
        <p className="text-[10px] text-black mt-2 uppercase tracking-wide font-bold">Via Ethereal SMTP</p>
      </div>

      {/* 3. BullMQ Queue Status */}
      <div className="renault-card p-4 relative overflow-hidden bg-white border border-black hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">BullMQ Active</span>
          <div className="w-6 h-6 bg-black rounded-[2px] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-[#ffed00]" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-black tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-black/10 animate-pulse rounded-[2px]"></div>
          ) : (
            (stats?.queue.delayed ?? 0) + (stats?.queue.active ?? 0) + (stats?.queue.waiting ?? 0)
          )}
        </div>
        <p className="text-[10px] text-[#666666] mt-2 uppercase tracking-wide font-medium">
          {stats ? `${stats.queue.delayed} delayed / ${stats.queue.active} active` : 'In Redis'}
        </p>
      </div>

      {/* 4. Rate-Limit Rescheduled */}
      <div className="renault-card p-4 relative overflow-hidden bg-white border border-black hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Throttled</span>
          <div className="w-6 h-6 bg-[#ffed00] border border-black rounded-[2px] flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-black" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-black tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-black/10 animate-pulse rounded-[2px]"></div>
          ) : (
            stats?.rescheduled ?? 0
          )}
        </div>
        <p className="text-[10px] text-[#666666] mt-2 uppercase tracking-wide font-medium">Delayed into next hr</p>
      </div>

      {/* 5. Search Engine / Indexing */}
      <div className="renault-card p-4 relative overflow-hidden bg-white border border-black col-span-2 md:col-span-1 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Search Engine</span>
          <div className="w-6 h-6 bg-black rounded-[2px] flex items-center justify-center">
            {stats?.esStatus.available ? (
              <Search className="w-3.5 h-3.5 text-[#ffed00]" />
            ) : (
              <Database className="w-3.5 h-3.5 text-[#ffed00]" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-[1px] ${
              stats?.esStatus.available ? 'bg-black animate-ping' : 'bg-black'
            }`}
          ></span>
          <span className="text-sm font-black text-black uppercase tracking-wider">
            {stats?.esStatus.available ? 'Elasticsearch' : 'SQL Fulltext'}
          </span>
        </div>
        <p className="text-[10px] text-[#666666] mt-2 uppercase tracking-wide truncate font-medium">
          {stats?.esStatus.available ? 'Active Lucene index' : 'Resilient DB fallback'}
        </p>
      </div>
    </div>
  );
};
