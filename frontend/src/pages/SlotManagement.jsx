import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Radio, Plus, Edit2, Wifi, Save
} from 'lucide-react';
import { api, useMediBoxSocket } from '../lib/api';
import { nativeHaptics } from '../lib/nativeBridge';
import { cn } from '../lib/utils';

export default function SlotManagement() {
  const [slots, setSlots] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [humanVerified, setHumanVerified] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slotsRes, schRes] = await Promise.all([
        api.getSlots(),
        api.getSchedules(),
      ]);
      setSlots(slotsRes.slots || []);
      setSchedules(schRes.schedules || []);
    } catch (err) {
      console.error('Failed to load slot data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useMediBoxSocket((event) => {
    if (event.type === 'DOSE_DISPENSED' || event.type === 'SLOT_UPDATED') {
      loadData();
    }
  });

  const handleOpenEdit = (slot) => {
    nativeHaptics.impactLight();
    setEditingSlot(slot.slotId);
    setEditFormData({
      medicineName: slot.medicineName === 'Empty Compartment' ? '' : slot.medicineName,
      pillCapacity: slot.pillCapacity || 30,
      currentCount: slot.currentCount || 0,
      refillThreshold: slot.refillThreshold || 5,
      pillColor: slot.pillColor || '#10b981',
      pillShape: slot.pillShape || 'Oval',
      ledColor: slot.ledColor || '#10b981',
    });
  };

  const handleSaveSlot = async (slotId) => {
    try {
      nativeHaptics.impactMedium();
      await api.updateSlot(slotId, {
        ...editFormData,
        status: editFormData.currentCount <= editFormData.refillThreshold && editFormData.currentCount > 0 ? 'low_stock' : editFormData.currentCount === 0 ? 'empty' : 'ready',
      });
      setEditingSlot(null);
      await loadData();
    } catch (err) {
      alert('Error updating slot: ' + err.message);
    }
  };

  const handleRefill = async (slotId, capacity) => {
    try {
      nativeHaptics.success();
      await api.refillSlot(slotId, capacity);
      await loadData();
    } catch (err) {
      alert('Refill failed: ' + err.message);
    }
  };

  const handleSyncToBox = async () => {
    if (!humanVerified) {
      nativeHaptics.warning();
      alert('Please check the verification checkbox to confirm physical pill placement.');
      return;
    }
    try {
      setSyncing(true);
      nativeHaptics.impactHeavy();
      const res = await api.syncToBox();
      setSyncSuccess(res.message || 'Synced to Smart Box via MQTT!');
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err) {
      alert('MQTT Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="w-full space-y-4 pb-4">
      {/* ─── HEADER & MQTT SYNC ────────────────────────────────────────── */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck size={12} /> Phase 2: Human-in-the-Loop
          </div>
          <button
            onClick={loadData}
            className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div>
          <h2 className="text-base font-heading font-bold text-white leading-tight">
            Slot Management & Mapping
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Verify physical pills loaded into compartments before syncing schedule over MQTT.
          </p>
        </div>

        {/* Verification Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={humanVerified}
            onChange={(e) => {
              nativeHaptics.impactLight();
              setHumanVerified(e.target.checked);
            }}
            className="w-4 h-4 mt-0.5 rounded text-primary-500 focus:ring-primary-400 bg-slate-800 border-slate-600"
          />
          <span className="text-[11px] text-slate-300 font-medium leading-snug">
            I confirm pills are physically loaded into the box slots and verified.
          </span>
        </label>

        {/* Sync Button */}
        <button
          onClick={handleSyncToBox}
          disabled={syncing || !humanVerified}
          className={cn(
            "w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95",
            humanVerified
              ? "bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/30 font-bold"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
          )}
        >
          <Radio size={14} className={syncing ? 'animate-pulse' : ''} />
          <span>{syncing ? 'Syncing via MQTT...' : 'Confirm & Sync to Box (MQTT)'}</span>
        </button>

        {syncSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{syncSuccess}</span>
          </motion.div>
        )}
      </div>

      {/* ─── 6 COMPARTMENTS (CLEAN MOBILE CARDS) ────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {slots.map((slot) => {
          const isAlerting = slot.status === 'alerting';
          const isLowStock = slot.status === 'low_stock';
          const isEmpty = slot.status === 'empty' || !slot.medicineId;
          const slotSchedules = schedules.filter(s => s.slotId === slot.slotId);

          return (
            <div
              key={slot.slotId}
              className={cn(
                "bg-slate-800/90 rounded-2xl p-3 border transition-all flex flex-col justify-between relative overflow-hidden",
                isAlerting
                  ? "border-amber-400 ring-2 ring-amber-400/30"
                  : isLowStock
                  ? "border-rose-500/50"
                  : "border-slate-700/80"
              )}
            >
              {/* LED glow top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: slot.ledColor || '#94a3b8' }}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between pt-1">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shadow-sm"
                    style={{ backgroundColor: slot.ledColor || '#0ea5e9' }}
                  >
                    #{slot.slotId}
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                    isAlerting ? "bg-amber-500/20 text-amber-300" :
                    isLowStock ? "bg-rose-500/20 text-rose-300" :
                    isEmpty ? "bg-slate-700/50 text-slate-400" : "bg-emerald-500/20 text-emerald-300"
                  )}>
                    {isAlerting ? 'Alerting' : isLowStock ? 'Low' : isEmpty ? 'Empty' : 'OK'}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-white text-xs truncate">
                    {slot.medicineName}
                  </h4>
                  <div className="flex justify-between items-baseline text-[10px] text-slate-400 mt-1">
                    <span>Stock</span>
                    <span className="font-mono text-white font-bold">{slot.currentCount}p</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={cn("h-full rounded-full", isLowStock ? "bg-rose-500" : "bg-primary-500")}
                      style={{ width: `${Math.min(100, (slot.currentCount / (slot.pillCapacity || 30)) * 100)}%` }}
                    />
                  </div>
                </div>

                {slotSchedules.length > 0 && (
                  <div className="text-[10px] font-mono text-primary-300 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20 truncate">
                    🕒 {slotSchedules[0].time}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-2.5 mt-2 border-t border-slate-700/60">
                <button
                  onClick={() => handleOpenEdit(slot)}
                  className="py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold text-center active:scale-95"
                >
                  Map
                </button>
                <button
                  onClick={() => handleRefill(slot.slotId, slot.pillCapacity)}
                  className="py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-center active:scale-95"
                >
                  Refill
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Slot Modal */}
      <AnimatePresence>
        {editingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-heading font-bold text-white text-sm">
                  Configure Compartment #{editingSlot}
                </h3>
                <button
                  onClick={() => setEditingSlot(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.medicineName}
                    onChange={(e) => setEditFormData({ ...editFormData, medicineName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Pill Count
                    </label>
                    <input
                      type="number"
                      value={editFormData.currentCount}
                      onChange={(e) => setEditFormData({ ...editFormData, currentCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Refill At
                    </label>
                    <input
                      type="number"
                      value={editFormData.refillThreshold}
                      onChange={(e) => setEditFormData({ ...editFormData, refillThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Slot LED Color
                  </label>
                  <input
                    type="color"
                    value={editFormData.ledColor}
                    onChange={(e) => setEditFormData({ ...editFormData, ledColor: e.target.value, pillColor: e.target.value })}
                    className="w-full h-8 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer p-0.5"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSlot(null)}
                    className="px-3 py-1.5 text-slate-400 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveSlot(editingSlot)}
                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
