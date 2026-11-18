import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Activity, CheckCircle2, Clock, XCircle,
  Play, FastForward, Unlock, Cpu, Thermometer, Droplets,
  BatteryCharging, AlertCircle, Layers, Radio, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, useMediBoxSocket } from '../lib/api';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [system, setSystem] = useState(null);
  const [slots, setSlots] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTimeouts, setActiveTimeouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from live backend
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sysRes, slotsRes, schRes, logsRes, alertsRes] = await Promise.all([
        api.getSystem(),
        api.getSlots(),
        api.getSchedules(),
        api.getLogs(),
        api.getAlerts(),
      ]);

      setSystem(sysRes.system);
      setActiveTimeouts(sysRes.activeTimeouts || []);
      setSlots(slotsRes.slots || []);
      setSchedules(schRes.schedules || []);
      setLogs(logsRes.logs || []);
      setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Real-time WebSocket connection
  useMediBoxSocket((event) => {
    if (event.type === 'DOSE_TRIGGERED') {
      const payload = event.payload;
      setActiveTimeouts(prev => [...prev.filter(t => t.slotId !== payload.slotId), payload]);
      loadDashboardData();
    } else if (event.type === 'TIMEOUT_TICK') {
      setActiveTimeouts(prev =>
        prev.map(t => (t.slotId === event.payload.slotId ? { ...t, remainingSec: event.payload.remainingSec } : t))
      );
    } else if (event.type === 'DOSE_DISPENSED') {
      setActiveTimeouts(prev => prev.filter(t => t.slotId !== event.payload.slotId));
      loadDashboardData();
    } else if (event.type === 'DOSE_MISSED') {
      setActiveTimeouts(prev => prev.filter(t => t.slotId !== event.payload.slotId));
      loadDashboardData();
    } else if (event.type === 'SLOT_UPDATED' || event.type === 'SYSTEM_UPDATED') {
      loadDashboardData();
    }
  });

  const handleTriggerTest = async (slotId = 1) => {
    try {
      await api.triggerDose({ slotId, customGraceSec: 300 });
      loadDashboardData();
    } catch (err) {
      alert('Trigger error: ' + err.message);
    }
  };

  const handleOpenLid = async (slotId) => {
    try {
      await api.dispense(slotId);
      loadDashboardData();
    } catch (err) {
      alert('Dispense error: ' + err.message);
    }
  };

  const handleFastForward = async (slotId) => {
    try {
      await api.fastForwardTimeout(slotId);
      loadDashboardData();
    } catch (err) {
      alert('Fast forward error: ' + err.message);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const takenCount = logs.filter(l => l.status === 'taken').length;
  const missedCount = logs.filter(l => l.status === 'missed').length;
  const totalCount = logs.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 92;

  const activeTimeout = activeTimeouts[0] || null;

  return (
    <div className="w-full space-y-4">
      {/* ─── 1. ACTIVE DOSE REMINDER BANNER (PHASE 3 & 5) ───────────────── */}
      <AnimatePresence>
        {activeTimeout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                Slot #{activeTimeout.slotId} Alerting
              </span>
              <span className="font-mono text-sm font-bold bg-black/30 px-2 py-0.5 rounded-lg">
                ⏱️ {formatSeconds(activeTimeout.remainingSec)}
              </span>
            </div>

            <h3 className="font-heading font-bold text-lg leading-tight">
              {activeTimeout.medicineName}
            </h3>
            <p className="text-white/80 text-xs mt-0.5 mb-3">
              Box chime sounding. Lid unlock enabled.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenLid(activeTimeout.slotId)}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Unlock size={14} /> Open Lid
              </button>
              <button
                onClick={() => handleFastForward(activeTimeout.slotId)}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <FastForward size={14} /> Skip / Miss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. SMART BOX HARDWARE TELEMETRY CARD ───────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-sm leading-tight">
                {system?.boxName || 'Living Room Smart Box'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {system?.boxId || 'BOX-MED-8491'} • MQTT Port: 1883
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
          </span>
        </div>

        {/* Environmental Sensor Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
          <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/60">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-[10px]">
              <Thermometer size={12} /> Temp
            </div>
            <span className="font-bold text-white text-xs mt-0.5 block">
              {system?.temperatureC || 22.4}°C
            </span>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/60">
            <div className="flex items-center justify-center gap-1 text-cyan-400 text-[10px]">
              <Droplets size={12} /> Humidity
            </div>
            <span className="font-bold text-white text-xs mt-0.5 block">
              {system?.humidityPct || 45.2}%
            </span>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/60">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-[10px]">
              <BatteryCharging size={12} /> Battery
            </div>
            <span className="font-bold text-white text-xs mt-0.5 block">
              {system?.batteryPct || 94}%
            </span>
          </div>
        </div>

        {/* Action Link to Hardware Simulator */}
        <Link
          to="/box-twin"
          className="w-full py-2 bg-primary-600/30 hover:bg-primary-600/40 border border-primary-500/40 text-primary-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <Radio size={14} className="text-primary-400" />
          <span>Open Interactive Smart Box Simulator</span>
        </Link>
      </div>

      {/* ─── 3. STAT CARDS (CLEAN 2x2 MOBILE GRID) ─────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Adherence */}
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Adherence</span>
            <Activity size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-white">
            {adherenceRate}%
          </div>
          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${adherenceRate}%` }} />
          </div>
          <p className="text-[10px] text-slate-400">Weekly intake rate</p>
        </div>

        {/* Doses Taken */}
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Verified</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-white">
            {takenCount} <span className="text-xs font-normal text-slate-400">/ {totalCount}</span>
          </div>
          <p className="text-[10px] text-slate-400">Intake detected</p>
        </div>

        {/* Missed Doses */}
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Missed</span>
            <XCircle size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-rose-400">
            {missedCount}
          </div>
          <p className="text-[10px] text-slate-400">Timeout alerts sent</p>
        </div>

        {/* Box Compartments */}
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Slots</span>
            <Layers size={14} className="text-primary-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-white">
            6 <span className="text-xs font-normal text-slate-400">Slots</span>
          </div>
          <p className="text-[10px] text-slate-400">Phase 2 mapped</p>
        </div>
      </div>

      {/* ─── 4. TODAY'S MEDICATION REGIMEN ──────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-white text-sm">
              Today's Regimen
            </h3>
            <p className="text-[10px] text-slate-400">Mapped alarm schedule</p>
          </div>
          <button
            onClick={() => handleTriggerTest(1)}
            className="px-2.5 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 border border-primary-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95"
          >
            <Play size={12} /> Test Alert
          </button>
        </div>

        <div className="space-y-2">
          {schedules.map((sch) => {
            const slot = slots.find(s => s.slotId === sch.slotId);
            const isAlerting = activeTimeouts.some(t => t.slotId === sch.slotId);

            return (
              <div
                key={sch.id}
                className={cn(
                  "p-3 rounded-xl border transition-all flex items-center justify-between gap-3",
                  isAlerting
                    ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30"
                    : "bg-slate-900/60 border-slate-700/60"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-sm"
                    style={{ backgroundColor: slot?.ledColor || '#0ea5e9' }}
                  >
                    #{sch.slotId}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{sch.medicineName}</h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      Compartment {sch.slotId} • {slot?.currentCount || 0} left
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-primary-300 bg-primary-500/20 px-2 py-0.5 rounded-lg border border-primary-500/30">
                    {sch.time}
                  </span>
                  <button
                    onClick={() => handleTriggerTest(sch.slotId)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Trigger Dose"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 5. SYSTEM ALERTS ───────────────────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
        <h3 className="font-heading font-bold text-white text-sm flex items-center gap-1.5">
          <AlertCircle size={15} className="text-rose-400" /> Alerts & Notifications
        </h3>

        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "p-3 rounded-xl border text-xs space-y-0.5",
                alert.severity === 'emergency'
                  ? "bg-rose-950/40 border-rose-800/50 text-rose-200"
                  : "bg-amber-950/40 border-amber-800/50 text-amber-200"
              )}
            >
              <div className="flex justify-between items-center font-bold text-[11px]">
                <span className="truncate pr-2">{alert.title}</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 shrink-0">
                  {alert.severity}
                </span>
              </div>
              <p className="text-slate-300 text-[10px] leading-relaxed">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
