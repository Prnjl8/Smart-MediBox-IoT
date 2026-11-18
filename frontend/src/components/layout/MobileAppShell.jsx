import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Layers, Plus, BarChart3, Menu, X, Smartphone,
  Radio, Camera, History as HistoryIcon, Settings as SettingsIcon,
  PhoneCall, ShieldAlert, Cpu, BatteryCharging, Wifi, Sparkles,
  Maximize2, Minimize2
} from 'lucide-react';
import { nativeHaptics, initMobileStatusBar } from '../../lib/nativeBridge';
import { cn } from '../../lib/utils';

export default function MobileAppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [deviceFrame, setDeviceFrame] = useState(true);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    initMobileStatusBar();
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (path) => {
    nativeHaptics.impactLight();
    setMoreDrawerOpen(false);
    navigate(path);
  };

  const navTabs = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Slots', icon: Layers, path: '/slots' },
    { label: 'Add Rx', icon: Plus, path: '/add-schedule', isCenter: true },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'More', icon: Menu, isMore: true },
  ];

  const drawerLinks = [
    { label: 'Smart Box Simulator', icon: Cpu, path: '/box-twin', badge: 'Live MQTT' },
    { label: 'Medicine Box Scanner', icon: Camera, path: '/box-scanner', badge: 'Vision OCR' },
    { label: 'Dose Intake History', icon: HistoryIcon, path: '/history' },
    { label: 'Vision Pill Verification', icon: Sparkles, path: '/vision' },
    { label: 'App Settings & Alerts', icon: SettingsIcon, path: '/settings' },
  ];

  const content = (
    <div className="relative w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* ─── NATIVE MOBILE STATUS BAR ────────────────────────────────────── */}
      <div className="h-9 pt-1.5 px-5 flex justify-between items-center text-xs font-semibold text-white/90 shrink-0 z-30 bg-slate-900/95 backdrop-blur-md">
        <span className="font-mono text-xs tracking-tight">{currentTime}</span>

        {/* Dynamic Island Pill */}
        <div className="w-20 h-3.5 bg-black rounded-full mx-auto flex items-center justify-end px-2 space-x-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/80">
          <Wifi size={12} className="text-emerald-400" />
          <BatteryCharging size={13} className="text-emerald-400" />
          <span>94%</span>
        </div>
      </div>

      {/* ─── MOBILE TOP APP BAR ─────────────────────────────────────────── */}
      <header className="px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
              alt="Robert Vance"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary-500/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div>
            <h2 className="text-xs font-heading font-bold text-white leading-tight">Robert Vance</h2>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Box Online
            </p>
          </div>
        </div>

        {/* Emergency SOS Button */}
        <button
          onClick={() => {
            nativeHaptics.warning();
            alert('🚨 EMERGENCY SOS: Alert dispatched to Dr. Sarah Mitchell (+1 555-382-9012) & Clara Vance (+1 555-729-4401)');
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-full text-[11px] font-bold transition-all active:scale-95"
        >
          <PhoneCall size={11} className="animate-pulse" />
          <span>SOS</span>
        </button>
      </header>

      {/* ─── SCROLLABLE APP BODY ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 pb-24 scroll-smooth">
        {children}
      </main>

      {/* ─── NATIVE BOTTOM TAB BAR ──────────────────────────────────────── */}
      <nav className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-3 pt-2 pb-2 flex flex-col justify-between z-30 shadow-2xl">
        <div className="flex items-center justify-around">
          {navTabs.map((tab, idx) => {
            if (tab.isCenter) {
              return (
                <button
                  key={idx}
                  onClick={() => handleTabClick(tab.path)}
                  className="relative -top-4 flex flex-col items-center group active:scale-90 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 text-white flex items-center justify-center shadow-lg shadow-primary-500/40 ring-3 ring-slate-900">
                    <Plus size={22} strokeWidth={2.5} />
                  </div>
                  <span className="text-[9px] font-bold text-primary-400 mt-0.5">Add Rx</span>
                </button>
              );
            }

            if (tab.isMore) {
              return (
                <button
                  key={idx}
                  onClick={() => {
                    nativeHaptics.impactLight();
                    setMoreDrawerOpen(true);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center w-12 py-1 transition-all active:scale-95",
                    moreDrawerOpen ? "text-primary-400" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Menu size={18} />
                  <span className="text-[9px] font-semibold mt-1">More</span>
                </button>
              );
            }

            const isActive = location.pathname.startsWith(tab.path);
            const Icon = tab.icon;

            return (
              <button
                key={idx}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 py-1 transition-all active:scale-95",
                  isActive ? "text-primary-400 font-bold" : "text-slate-400 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileTabActive"
                    className="absolute -top-1.5 w-6 h-0.5 bg-primary-400 rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={18} className={isActive ? "scale-105" : ""} />
                <span className="text-[9px] mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* iPhone Home Indicator Line */}
        <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-2 shrink-0"></div>
      </nav>

      {/* ─── MOBILE BOTTOM DRAWER (MORE) ─────────────────────────────────── */}
      <AnimatePresence>
        {moreDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreDrawerOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 pb-8 space-y-3 max-h-[80vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1" />

              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-heading font-bold text-white text-sm">App Features & Tools</h3>
                <button
                  onClick={() => setMoreDrawerOpen(false)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1.5">
                {drawerLinks.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTabClick(item.path)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 transition-colors text-left active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                        <span className="text-xs font-semibold">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4">
      {/* Desktop Mode Toggle Bar */}
      <div className="hidden sm:flex items-center justify-between max-w-[390px] w-full mb-3 px-2 text-xs font-bold text-slate-400">
        <div className="flex items-center gap-1.5">
          <Smartphone size={14} className="text-primary-400" />
          <span>Smart MediBox Mobile App</span>
        </div>
        <button
          onClick={() => setDeviceFrame(!deviceFrame)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
        >
          {deviceFrame ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          <span>{deviceFrame ? 'Fullscreen' : 'iPhone Mockup'}</span>
        </button>
      </div>

      {/* Main Container: iPhone Mockup vs Full Mobile Screen */}
      {deviceFrame ? (
        <div className="relative w-full max-w-[390px] h-[820px] max-h-[96vh] rounded-[48px] bg-slate-950 p-2.5 shadow-2xl shadow-primary-950/50 ring-1 ring-slate-800 border-4 border-slate-800 flex flex-col overflow-hidden">
          <div className="w-full h-full rounded-[38px] overflow-hidden relative flex flex-col bg-slate-900">
            {content}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[420px] h-screen flex flex-col shadow-2xl overflow-hidden bg-slate-900">
          {content}
        </div>
      )}
    </div>
  );
}
