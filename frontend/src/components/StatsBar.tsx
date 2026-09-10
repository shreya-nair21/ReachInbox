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
      <div className="p-4 relative overflow-hidden bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Scheduled</span>
          <div className="w-7 h-7 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-neutral-900 tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-neutral-100 animate-pulse rounded-md"></div>
          ) : (
            stats?.scheduled ?? 0
          )}
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-wide font-medium">Pending dispatch</p>
      </div>

      {/* 2. Delivered / Sent */}
      <div className="p-4 relative overflow-hidden bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Delivered</span>
          <div className="w-7 h-7 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-neutral-900 tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-neutral-100 animate-pulse rounded-md"></div>
          ) : (
            stats?.sent ?? 0
          )}
        </div>
        <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-wide font-semibold">Via Ethereal SMTP</p>
      </div>

      {/* 3. BullMQ Queue Status */}
      <div className="p-4 relative overflow-hidden bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">BullMQ Active</span>
          <div className="w-7 h-7 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-neutral-900 tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-neutral-100 animate-pulse rounded-md"></div>
          ) : (
            (stats?.queue.delayed ?? 0) + (stats?.queue.active ?? 0) + (stats?.queue.waiting ?? 0)
          )}
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-wide font-medium">
          {stats ? `${stats.queue.delayed} delayed / ${stats.queue.active} active` : 'In Redis'}
        </p>
      </div>

      {/* 4. Rate-Limit Rescheduled */}
      <div className="p-4 relative overflow-hidden bg-white border border-neutral-200/90 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Throttled</span>
          <div className="w-7 h-7 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-3xl font-black text-neutral-900 tracking-tight leading-none font-sans">
          {loading ? (
            <div className="h-8 w-12 bg-neutral-100 animate-pulse rounded-md"></div>
          ) : (
            stats?.rescheduled ?? 0
          )}
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-wide font-medium">Delayed into next hr</p>
      </div>

      {/* 5. Search Engine / Indexing */}
      <div className="p-4 relative overflow-hidden bg-white border border-neutral-200/90 rounded-xl col-span-2 md:col-span-1 shadow-sm hover:shadow-md hover:border-neutral-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Search Engine</span>
          <div className="w-7 h-7 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg flex items-center justify-center">
            {stats?.esStatus.available ? (
              <Search className="w-4 h-4 text-amber-600" />
            ) : (
              <Database className="w-4 h-4 text-neutral-500" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              stats?.esStatus.available ? 'bg-emerald-500 animate-ping' : 'bg-neutral-400'
            }`}
          ></span>
          <span className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            {stats?.esStatus.available ? 'Elasticsearch' : 'SQL Fulltext'}
          </span>
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-wide truncate font-medium">
          {stats?.esStatus.available ? 'Active Lucene index' : 'Resilient DB fallback'}
        </p>
      </div>
    </div>
  );
};
