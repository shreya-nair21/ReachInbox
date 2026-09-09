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
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Scheduled</span>
          <CalendarClock className="w-4 h-4 text-brand-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded"></div>
          ) : (
            stats?.scheduled ?? 0
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Pending dispatch</p>
      </div>

      {/* 2. Sent */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Delivered</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded"></div>
          ) : (
            stats?.sent ?? 0
          )}
        </div>
        <p className="text-[11px] text-emerald-400/80 mt-1">Via Ethereal SMTP</p>
      </div>

      {/* 3. BullMQ Queue Status */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">BullMQ Active</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded"></div>
          ) : (
            (stats?.queue.delayed ?? 0) + (stats?.queue.active ?? 0) + (stats?.queue.waiting ?? 0)
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {stats ? `${stats.queue.delayed} delayed / ${stats.queue.active} active` : 'In Redis'}
        </p>
      </div>

      {/* 4. Rate-Limit Rescheduled */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Rate Throttled</span>
          <ShieldAlert className="w-4 h-4 text-violet-400" />
        </div>
        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded"></div>
          ) : (
            stats?.rescheduled ?? 0
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Rescheduled to next hr</p>
      </div>

      {/* 5. Search Engine / Indexing */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden col-span-2 md:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Search Engine</span>
          {stats?.esStatus.available ? (
            <Search className="w-4 h-4 text-cyan-400" />
          ) : (
            <Database className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              stats?.esStatus.available ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
            }`}
          ></span>
          <span className="text-sm font-semibold text-slate-200">
            {stats?.esStatus.available ? 'Elasticsearch' : 'SQL Fulltext'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          {stats?.esStatus.available ? 'Active Lucene index' : 'Resilient DB fallback'}
        </p>
      </div>
    </div>
  );
};
