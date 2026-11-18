import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Wifi, Volume2, VolumeX, Play, FastForward, Unlock,
  Lock, ArrowDown, Terminal
} from 'lucide-react';
import { api, useMediBoxSocket } from '../lib/api';
import { nativeHaptics } from '../lib/nativeBridge';
import { cn } from '../lib/utils';

export default function SmartBoxTwin() {
  const [system, setSystem] = useState(null);
  const [slots, setSlots] = useState([]);
  const [activeTimeouts, setActiveTimeouts] = useState([]);
  const [mqttPackets, setMqttPackets] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [recentAction, setRecentAction] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sysRes, slotsRes] = await Promise.all([
        api.getSystem(),
        api.getSlots(),
      ]);
      setSystem(sysRes.system);
      setActiveTimeouts(sysRes.activeTimeouts || []);
      setSlots(slotsRes.slots || []);
    } catch (err) {
      console.error('Error loading digital twin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const speakReminder = (text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  useMediBoxSocket((event) => {
    if (event.type === 'DOSE_TRIGGERED') {
      const payload = event.payload;
      setActiveTimeouts(prev => [...prev.filter(t => t.slotId !== payload.slotId), payload]);
      nativeHaptics.impactHeavy();
      speakReminder(`Attention, please take your medication, ${payload.medicineName}, from compartment ${payload.slotId}.`);
      setRecentAction(`🔔 Slot ${payload.slotId} Alerting`);
      loadData();
    } else if (event.type === 'TIMEOUT_TICK') {
      setActiveTimeouts(prev =>
        prev.map(t => (t.slotId === event.payload.slotId ? { ...t, remainingSec: event.payload.remainingSec } : t))
      );
    } else if (event.type === 'DOSE_DISPENSED') {
      setActiveTimeouts(prev => prev.filter(t => t.slotId !== event.payload.slotId));
      nativeHaptics.success();
      speakReminder(`Dose verified and intake recorded.`);
      setRecentAction(`✅ Slot ${event.payload.slotId} dispensed`);
      loadData();
    } else if (event.type === 'DOSE_MISSED') {
      setActiveTimeouts(prev => prev.filter(t => t.slotId !== event.payload.slotId));
      nativeHaptics.warning();
      setRecentAction(`🚨 Grace expired for Slot ${event.payload.slotId}`);
      loadData();
    } else if (event.type === 'MQTT_PACKET') {
      setMqttPackets(prev => [event.payload, ...prev.slice(0, 15)]);
    } else if (event.type === 'SLOT_UPDATED' || event.type === 'SYSTEM_UPDATED') {
      loadData();
    }
  });

  const handleTriggerTest = async (slotId) => {
    try {
      nativeHaptics.impactMedium();
      await api.triggerDose({ slotId, customGraceSec: 300 });
      setRecentAction(`🚀 Triggered dose on Slot ${slotId}`);
    } catch (err) {
      alert('Trigger error: ' + err.message);
    }
  };

  const handleTapTouch = async (slotId) => {
    try {
      nativeHaptics.impactLight();
      await api.tapTouch(slotId);
      setRecentAction(`👆 Slot ${slotId} unlocked by touch`);
      loadData();
    } catch (err) {
      alert('Touch error: ' + err.message);
    }
  };

  const handleOpenLid = async (slotId) => {
    try {
      nativeHaptics.success();
      await api.dispense(slotId);
      setRecentAction(`🔓 Lid opened on Slot ${slotId}. Dispensed!`);
    } catch (err) {
      alert('Dispense error: ' + err.message);
    }
  };

  const handleFastForward = async (slotId) => {
    try {
      nativeHaptics.warning();
      await api.fastForwardTimeout(slotId);
      setRecentAction(`⏩ Fast-forwarded timeout on Slot ${slotId}`);
    } catch (err) {
      alert('Fast forward error: ' + err.message);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeTimeout = activeTimeouts[0] || null;

  return (
    <div className="w-full space-y-4 pb-4">
      {/* ─── HEADER & CONTROLS ─────────────────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold uppercase tracking-wider">
            <Cpu size={12} /> Hardware Digital Twin
          </div>
          <button
            onClick={() => {
              nativeHaptics.impactLight();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 text-xs font-bold flex items-center gap-1"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="text-[10px]">{soundEnabled ? 'Voice ON' : 'Muted'}</span>
          </button>
        </div>

        <div>
          <h2 className="text-base font-heading font-bold text-white leading-tight">
            Smart MediBox Physical Twin
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Realistic mobile twin simulating OLED, glowing LEDs, touch unlock, and Hall effect lid opening.
          </p>
        </div>

        {recentAction && (
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-primary-300">
            {recentAction}
          </div>
        )}
      </div>

      {/* ─── 0.96" OLED SCREEN (SSD1306 PIXEL SIMULATION) ─────────────── */}
      <div className="bg-black border-2 border-slate-700 rounded-2xl p-3 shadow-inner font-mono text-xs">
        <div className="flex justify-between items-center text-cyan-400 border-b border-cyan-800/50 pb-1 mb-1.5 text-[9px]">
          <span className="font-bold flex items-center gap-1">
            <Cpu size={10} /> OLED 128x64
          </span>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-emerald-400 font-bold">WIFI OK</span>
        </div>

        {activeTimeout ? (
          <div className="text-amber-300 space-y-0.5 animate-pulse">
            <div className="font-bold uppercase tracking-wider text-[10px] bg-amber-950/80 px-1 py-0.5 rounded text-amber-200">
              ⚠️ TAKE COMPARTMENT #{activeTimeout.slotId}
            </div>
            <div className="text-white font-bold text-xs truncate">{activeTimeout.medicineName}</div>
            <div className="flex justify-between text-[9px] text-cyan-300 pt-0.5">
              <span>DOSE: {activeTimeout.doseCount || 1} PILL</span>
              <span className="font-bold text-rose-400">GRACE: {formatSeconds(activeTimeout.remainingSec)}</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 space-y-0.5 py-0.5">
            <div className="text-emerald-400 font-bold text-[11px]">ALL COMPARTMENTS IDLE</div>
            <div className="text-[10px]">Awaiting next scheduled dose...</div>
            <div className="flex justify-between text-[8px] text-slate-500 pt-1">
              <span>T: {system?.temperatureC || 22.4}°C</span>
              <span>H: {system?.humidityPct || 45}%</span>
              <span>BAT: {system?.batteryPct || 94}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── 6 COMPARTMENT MOBILE HARDWARE GRID ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {slots.map((slot) => {
          const timeout = activeTimeouts.find(t => t.slotId === slot.slotId);
          const isAlerting = !!timeout;
          const isUnlocked = slot.isUnlocked;
          const isLidOpen = slot.isLidOpen;

          return (
            <div
              key={slot.slotId}
              className={cn(
                "rounded-2xl p-3 border transition-all flex flex-col justify-between relative",
                isAlerting
                  ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/30"
                  : "bg-slate-800/80 border-slate-700/80"
              )}
            >
              <div className="space-y-1.5">
                {/* LED glow & slot label */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn("w-3 h-3 rounded-full", isAlerting ? "animate-ping" : "")}
                      style={{
                        backgroundColor: slot.ledColor || '#10b981',
                        boxShadow: isAlerting ? `0 0 12px ${slot.ledColor}` : `0 0 4px ${slot.ledColor}`,
                      }}
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-400">SLOT {slot.slotId}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{slot.currentCount}p</span>
                </div>

                <h4 className="font-heading font-bold text-white text-xs truncate">
                  {slot.medicineName}
                </h4>

                <div className="text-[10px] text-slate-400 font-mono">
                  {isLidOpen ? (
                    <span className="text-emerald-400 font-bold">Lid OPEN</span>
                  ) : isUnlocked ? (
                    <span className="text-cyan-400 font-bold">Unlocked</span>
                  ) : (
                    <span className="text-slate-500">Locked</span>
                  )}
                  {isAlerting && (
                    <span className="ml-1 text-rose-400 font-bold">({formatSeconds(timeout.remainingSec)})</span>
                  )}
                </div>
              </div>

              {/* Touch & Hall Sensor Buttons */}
              <div className="grid grid-cols-2 gap-1 pt-2 mt-2 border-t border-slate-700/60">
                <button
                  onClick={() => handleTapTouch(slot.slotId)}
                  className="py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold text-center active:scale-95"
                  title="Capacitive Touch"
                >
                  Touch
                </button>
                <button
                  onClick={() => handleOpenLid(slot.slotId)}
                  disabled={!isUnlocked && !isAlerting}
                  className={cn(
                    "py-1 rounded-lg text-[10px] font-bold text-center active:scale-95",
                    isUnlocked || isAlerting
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  )}
                  title="Hall Effect Sensor"
                >
                  Lid
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── SCENARIO TRIGGERS ─────────────────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-2.5">
        <h3 className="font-heading font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Play size={13} className="text-primary-400" /> Operational Test Triggers
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTriggerTest(1)}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 rounded-xl text-left active:scale-95 transition-all"
          >
            <div className="font-bold text-white text-[11px]">🔔 Trigger Slot 1</div>
            <div className="text-[9px] text-slate-400">Normal dose alert</div>
          </button>

          <button
            onClick={() => handleTriggerTest(2)}
            className="p-2.5 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 rounded-xl text-left active:scale-95 transition-all"
          >
            <div className="font-bold text-amber-300 text-[11px]">⚠️ Trigger Slot 2</div>
            <div className="text-[9px] text-amber-400">Refill warning (&lt; 5p)</div>
          </button>
        </div>

        {activeTimeout && (
          <button
            onClick={() => handleFastForward(activeTimeout.slotId)}
            className="w-full py-2 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
          >
            <FastForward size={14} />
            <span>Fast-Forward Timeout (Expire 5-min grace)</span>
          </button>
        )}
      </div>

      {/* ─── LIVE MQTT TERMINAL ─────────────────────────────────────────── */}
      <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-2 font-mono text-[10px]">
        <div className="flex justify-between items-center text-primary-400 font-bold border-b border-slate-800 pb-1.5">
          <span className="flex items-center gap-1">
            <Terminal size={12} /> Live MQTT Console
          </span>
          <span className="text-[9px] text-slate-500">Port 1883</span>
        </div>

        <div className="h-32 overflow-y-auto space-y-1.5 pr-1">
          {mqttPackets.length === 0 ? (
            <div className="text-slate-600 italic py-4 text-center">
              Listening for MQTT packets...
            </div>
          ) : (
            mqttPackets.map((pkt, i) => (
              <div key={i} className="p-1.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className={pkt.direction === 'OUTBOUND' ? 'text-cyan-400' : 'text-emerald-400'}>
                    {pkt.direction === 'OUTBOUND' ? '📤 OUT' : '📥 IN'} • {pkt.topic}
                  </span>
                  <span className="text-slate-600">
                    {new Date(pkt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-slate-300 truncate">
                  {typeof pkt.data === 'string' ? pkt.data : JSON.stringify(pkt.data)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
