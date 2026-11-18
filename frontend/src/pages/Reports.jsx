import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Sparkles, CheckCircle2, ShieldCheck, Stethoscope,
  HeartPulse, Thermometer, Loader2, Download, Target, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api, useMediBoxSocket } from '../lib/api';
import { nativeHaptics } from '../lib/nativeBridge';
import { cn } from '../lib/utils';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReportsAndLogs = async () => {
    try {
      setLoading(true);
      const [repRes, logsRes] = await Promise.all([
        api.getComplianceReports(),
        api.getLogs(),
      ]);
      setReports(repRes.reports || []);
      setLogs(logsRes.logs || []);
      if (repRes.reports?.length > 0) {
        setCurrentReport(repRes.reports[0]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsAndLogs();
  }, []);

  useMediBoxSocket((event) => {
    if (event.type === 'DOSE_DISPENSED' || event.type === 'DOSE_MISSED') {
      loadReportsAndLogs();
    }
  });

  const handleGenerateAiReport = async () => {
    try {
      nativeHaptics.impactHeavy();
      setIsGenerating(true);
      const res = await api.generateComplianceReport();
      if (res.success && res.report) {
        nativeHaptics.success();
        setCurrentReport(res.report);
        setReports(prev => [res.report, ...prev]);
      } else {
        throw new Error(res.error || 'Failed to generate AI report');
      }
    } catch (err) {
      alert('AI Report Generation Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalDoses = logs.length;
  const takenDoses = logs.filter(l => l.status === 'taken').length;
  const missedDoses = logs.filter(l => l.status === 'missed').length;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 92;

  const chartData = [
    { day: 'M', adherence: 94 },
    { day: 'T', adherence: 88 },
    { day: 'W', adherence: 96 },
    { day: 'T', adherence: 100 },
    { day: 'F', adherence: 80 },
    { day: 'S', adherence: 75 },
    { day: 'S', adherence: 92 },
  ];

  return (
    <div className="w-full space-y-4 pb-4">
      {/* ─── HEADER & GENERATE BUTTON ───────────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles size={12} /> Phase 6: AI Compliance
        </div>

        <div>
          <h2 className="text-base font-heading font-bold text-white leading-tight">
            Adherence & Clinical Insights
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Secondary AI pipeline analyzing dose timings, delays, and risk factors.
          </p>
        </div>

        <button
          onClick={handleGenerateAiReport}
          disabled={isGenerating}
          className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Analyzing Patient Logs...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Generate AI Compliance Report</span>
            </>
          )}
        </button>
      </div>

      {/* ─── 2x2 STAT CARDS (MOBILE GRID) ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase">
            <span>Adherence</span>
            <Target size={13} className="text-primary-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-white flex items-baseline gap-1.5">
            {currentReport?.adherenceRate || adherenceRate}%
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 rounded">
              {currentReport?.scoreGrade || 'A'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Past 7 days</p>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase">
            <span>Risk Level</span>
            <ShieldCheck size={13} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-white">
            {currentReport?.riskLevel || 'Low'}
          </div>
          <p className="text-[10px] text-slate-400">Non-adherence risk</p>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase">
            <span>Doses</span>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl font-heading font-bold text-white">
            <span className="text-emerald-400">{takenDoses}</span> / <span className="text-rose-400">{missedDoses}</span>
          </div>
          <p className="text-[10px] text-slate-400">Taken vs Missed</p>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase">
            <span>Storage</span>
            <Thermometer size={13} className="text-cyan-400" />
          </div>
          <div className="text-xl font-heading font-bold text-white">
            {currentReport?.environmentalStability?.status || 'Optimal'}
          </div>
          <p className="text-[10px] text-slate-400">22.4°C • 45% Hum</p>
        </div>
      </div>

      {/* ─── AI REPORT CONTENT ─────────────────────────────────────────── */}
      {currentReport && (
        <div className="space-y-3">
          {/* Executive Summary */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
                Clinical Summary
              </h3>
              <span className="text-[9px] font-mono text-primary-300 bg-primary-500/20 px-1.5 py-0.5 rounded">
                Gemini 2.5
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {currentReport.executiveSummary}
            </p>
          </div>

          {/* Behavioral Patterns */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-2.5">
            <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-primary-400" /> Behavioral Trends
            </h3>
            <div className="space-y-2">
              {currentReport.behavioralPatterns?.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs">{item.pattern}</span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                      item.impact === 'High' ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                    )}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Recommendations */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-2">
            <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope size={14} className="text-emerald-400" /> Doctor Recommendations
            </h3>
            <ul className="space-y-1.5">
              {currentReport.doctorRecommendations?.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-emerald-950/30 p-2 rounded-xl border border-emerald-800/40">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Family Action Items */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-2">
            <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse size={14} className="text-primary-400" /> Family Action Items
            </h3>
            <ul className="space-y-1.5">
              {currentReport.familyActionItems?.map((act, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-primary-950/30 p-2 rounded-xl border border-primary-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-1.5"></span>
                  <span className="text-[11px] leading-snug">{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ─── COMPACT DAY-OF-WEEK BAR CHART ──────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-2">
        <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider">
          Weekly Adherence Trend
        </h3>
        <div className="h-28 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val) => [`${val}%`, 'Adherence']}
              />
              <Bar dataKey="adherence" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.adherence >= 90 ? '#10b981' : entry.adherence >= 80 ? '#38bdf8' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
