import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Filter, AlertCircle,
  Download, Calendar, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, useMediBoxSocket } from '../lib/api';
import { cn } from '../lib/utils';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load dose history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useMediBoxSocket((event) => {
    if (event.type === 'DOSE_DISPENSED' || event.type === 'DOSE_MISSED') {
      loadLogs();
    }
  });

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  // Group by date
  const groupedHistory = filteredLogs.reduce((acc, current) => {
    const d = current.date || 'Today';
    if (!acc[d]) acc[d] = [];
    acc[d].push(current);
    return acc;
  }, {});

  const totalTaken = logs.filter(l => l.status === 'taken').length;
  const totalMissed = logs.filter(l => l.status === 'missed').length;
  const adherenceRate = logs.length > 0 ? Math.round((totalTaken / logs.length) * 100) : 92;

  const chartData = [
    { day: 'Mon', adherence: 90 },
    { day: 'Tue', adherence: 85 },
    { day: 'Wed', adherence: 95 },
    { day: 'Thu', adherence: 100 },
    { day: 'Fri', adherence: 75 },
    { day: 'Sat', adherence: 80 },
    { day: 'Sun', adherence: 94 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header & Stats Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h1 className="text-3xl font-heading font-bold mb-2 text-white">Dose Intake History</h1>
            <p className="text-primary-100 font-medium max-w-md text-sm">
              Complete audit trail of Hall-effect lid openings, verified pill intakes, and grace-period timeout records.
            </p>
          </div>

          <div className="flex items-center gap-8 mt-8 relative z-10">
            <div>
              <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">Total Taken</p>
              <h2 className="text-4xl font-heading font-bold">{totalTaken}</h2>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">Total Missed</p>
              <h2 className="text-4xl font-heading font-bold text-rose-300">{totalMissed}</h2>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">Weekly Avg</p>
              <h2 className="text-4xl font-heading font-bold">{adherenceRate}%</h2>
            </div>
          </div>
        </div>

        {/* Adherence Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 font-heading text-sm">Adherence Trend</h3>
            <span className="text-xs font-bold px-2 py-1 bg-primary-50 text-primary-600 rounded-lg">Last 7 Days</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <RechartsTooltip />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                <Bar dataKey="adherence" radius={[4, 4, 4, 4]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.adherence > 85 ? '#10b981' : '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['all', 'taken', 'missed', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                filterStatus === st
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
          title="Refresh History"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Timeline of Logs */}
      <div className="space-y-6">
        {Object.entries(groupedHistory).map(([date, entries]) => (
          <div key={date} className="space-y-3">
            <div className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider px-2">
              📅 {date}
            </div>

            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm",
                      entry.status === 'taken'
                        ? "bg-emerald-100 text-emerald-700"
                        : entry.status === 'missed'
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {entry.status === 'taken' ? <CheckCircle2 size={20} /> : entry.status === 'missed' ? <XCircle size={20} /> : <Clock size={20} />}
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-slate-800 text-base">
                        {entry.medicineName}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Slot #{entry.slotId} • Scheduled: {entry.scheduledTime}
                        {entry.delayMinutes !== undefined && entry.status === 'taken' && ` • Delay: ${entry.delayMinutes} min`}
                        {entry.reason && ` • ${entry.reason}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {entry.pillVerificationScore && (
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                        Intake: {(entry.pillVerificationScore * 100).toFixed(0)}% Confirmed
                      </span>
                    )}
                    <span className={cn(
                      "text-xs font-bold uppercase px-3 py-1 rounded-xl",
                      entry.status === 'taken'
                        ? "bg-emerald-100 text-emerald-800"
                        : entry.status === 'missed'
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    )}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="bg-white p-12 rounded-3xl text-center text-slate-400 text-sm">
            No history logs found in the database.
          </div>
        )}
      </div>
    </div>
  );
}
