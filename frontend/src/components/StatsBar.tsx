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
      <div className="renault-card p-4 relative overflow-hidden group hover:border-[#ffed00]/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider">Scheduled</span>
          <CalendarClock className="w-4 h-4 text-[#ffed00]" />
        </div>
        <div className="mt-2 text-3xl font-black text-white tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-white/10 animate-pulse rounded-[2px]"></div>
          ) : (
            stats?.scheduled ?? 0
          )}
        </div>
        <p className="text-[10px] text-[#8a8a8a] mt-1.5 uppercase tracking-wide">Pending dispatch</p>
      </div>

      {/* 2. Delivered / Sent */}
      <div className="renault-card p-4 relative overflow-hidden group hover:border-[#ffed00]/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider">Delivered</span>
          <CheckCircle2 className="w-4 h-4 text-[#ffed00]" />
        </div>
        <div className="mt-2 text-3xl font-black text-white tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-white/10 animate-pulse rounded-[2px]"></div>
          ) : (
            stats?.sent ?? 0
          )}
        </div>
        <p className="text-[10px] text-[#ffed00] mt-1.5 uppercase tracking-wide font-semibold">Via Ethereal SMTP</p>
      </div>

      {/* 3. BullMQ Queue Status */}
      <div className="renault-card p-4 relative overflow-hidden group hover:border-[#ffed00]/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider">BullMQ Active</span>
          <Clock className="w-4 h-4 text-white/70" />
        </div>
        <div className="mt-2 text-3xl font-black text-white tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-white/10 animate-pulse rounded-[2px]"></div>
          ) : (
            (stats?.queue.delayed ?? 0) + (stats?.queue.active ?? 0) + (stats?.queue.waiting ?? 0)
          )}
        </div>
        <p className="text-[10px] text-[#8a8a8a] mt-1.5 uppercase tracking-wide">
          {stats ? `${stats.queue.delayed} delayed / ${stats.queue.active} active` : 'In Redis'}
        </p>
      </div>

      {/* 4. Rate-Limit Rescheduled */}
      <div className="renault-card p-4 relative overflow-hidden group hover:border-[#ffed00]/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider">Throttled</span>
          <ShieldAlert className="w-4 h-4 text-[#ffed00]" />
        </div>
        <div className="mt-2 text-3xl font-black text-white tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-white/10 animate-pulse rounded-[2px]"></div>
          ) : (
            stats?.rescheduled ?? 0
          )}
        </div>
        <p className="text-[10px] text-[#8a8a8a] mt-1.5 uppercase tracking-wide">Rescheduled into next hr</p>
      </div>

      {/* 5. Search Engine / Indexing */}
      <div className="renault-card p-4 relative overflow-hidden col-span-2 md:col-span-1 group hover:border-[#ffed00]/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider">Search Engine</span>
          {stats?.esStatus.available ? (
            <Search className="w-4 h-4 text-[#ffed00]" />
          ) : (
            <Database className="w-4 h-4 text-[#ffed00]" />
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-[1px] ${
              stats?.esStatus.available ? 'bg-[#ffed00] animate-ping' : 'bg-[#ffed00]'
            }`}
          ></span>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            {stats?.esStatus.available ? 'Elasticsearch' : 'SQL Fulltext'}
          </span>
        </div>
        <p className="text-[10px] text-[#8a8a8a] mt-1.5 uppercase tracking-wide truncate">
          {stats?.esStatus.available ? 'Active Lucene index' : 'Resilient DB fallback'}
        </p>
      </div>
    </div>
  );
};
