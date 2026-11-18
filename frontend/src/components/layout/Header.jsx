import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Mic, Menu, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { VoiceInterface } from '../AdvancedFeatures';

// Helper icon component for search stub
const HistoryIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
    </svg>
);

export const Header = ({ sidebarCollapsed, setSidebarCollapsed }) => {
    const [searchFocused, setSearchFocused] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [voiceOpen, setVoiceOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <VoiceInterface isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
            <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-primary-100 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 rounded-full hover:bg-primary-50 text-slate-500 transition-colors md:hidden"
                    >
                        <Menu size={24} />
                    </button>

                    <div className={cn(
                        "relative flex items-center transition-all duration-300",
                        searchFocused ? "w-96" : "w-64"
                    )}>
                        <Search className={cn("absolute left-3 w-5 h-5 transition-colors", searchFocused ? "text-primary-500" : "text-slate-400")} />
                        <input
                            type="text"
                            placeholder="Search patients, medicines..."
                            className="w-full pl-10 pr-4 py-2.5 bg-primary-50 border border-primary-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all text-sm font-medium"
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                        <AnimatePresence>
                            {searchFocused && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-14 left-0 w-full bg-white rounded-2xl shadow-xl border border-primary-100 p-2 z-50 py-4"
                                >
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Recent Searches</div>
                                    <ul>
                                        <li className="px-3 py-2 hover:bg-primary-50 rounded-xl cursor-pointer transition-colors text-sm flex items-center gap-3">
                                            <HistoryIcon className="w-4 h-4 text-slate-400" />
                                            John Doe (Patient)
                                        </li>
                                        <li className="px-3 py-2 hover:bg-primary-50 rounded-xl cursor-pointer transition-colors text-sm flex items-center gap-3">
                                            <HistoryIcon className="w-4 h-4 text-slate-400" />
                                            Aspirin 500mg (Medicine)
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    {/* Voice Command Stub */}
                    <button
                        onClick={() => setVoiceOpen(true)}
                        className="relative p-2.5 rounded-full hover:bg-primary-50 text-slate-500 transition-colors group"
                    >
                        <Mic className="w-5 h-5 group-hover:text-primary-500 transition-colors" />
                        <span className="absolute inset-0 rounded-full border border-primary-500 scale-150 opacity-0 group-hover:animate-ping"></span>
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 rounded-full hover:bg-primary-50 text-slate-500 transition-colors group"
                        >
                            <Bell className={cn("w-5 h-5 transition-transform", showNotifications ? "text-primary-600" : "group-hover:text-primary-500")} />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-white animate-bounce-soft"></span>
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-14 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary-100 overflow-hidden z-50 origin-top-right"
                                >
                                    <div className="p-4 border-b border-primary-50 flex justify-between items-center bg-primary-50/50">
                                        <h3 className="font-heading font-bold text-slate-800">Alerts</h3>
                                        <button className="text-xs text-primary-600 font-medium hover:underline">Mark all read</button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto p-2">
                                        <div className="p-3 mb-1 rounded-xl bg-error/10 hover:bg-error/20 transition-colors cursor-pointer group flex gap-3 relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                                            <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center shrink-0">
                                                <Bell className="w-4 h-4 text-error group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Missed Dose</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">John Doe missed Metformin at 8:00 AM</p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl hover:bg-primary-50 transition-colors cursor-pointer group flex gap-3 relative overflow-hidden">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                                <Bell className="w-4 h-4 text-primary-600 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Low Inventory</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">Compartment 4 is running low (3 remaining)</p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block"></div>

                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-3 hover:bg-primary-50 p-1.5 pr-4 rounded-full transition-colors group border border-transparent hover:border-primary-100"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-400 to-accent-400 p-0.5 animate-pulse-slow">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-primary-600" />
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-start translate-x-0 group-hover:translate-x-1 transition-transform">
                            <span className="text-sm font-bold font-heading text-slate-800 leading-none">Dr. Smith</span>
                            <span className="text-xs text-primary-500 font-medium">Cardiologist</span>
                        </div>
                    </button>
                </div>
            </header>
        </>
    );
};
