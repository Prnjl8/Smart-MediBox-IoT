import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, LayoutGrid, List, CheckCircle2,
    MoreVertical, Phone, Mail, FileText, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Stub Data ---
const MOCK_PATIENTS = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: `Patient ${i + 1}`,
    status: i % 3 === 0 ? 'offline' : 'online',
    adherence: Math.floor(Math.random() * 40 + 60),
    nextDose: `${Math.floor(Math.random() * 12 + 1)}:00 ${i % 2 === 0 ? 'AM' : 'PM'}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Pat${i}&backgroundColor=${['b6e3f4', 'c0aede', 'ffdfbf', 'd1d4f9'][i % 4]}`,
}));

const Patients = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading skeleton
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const filtered = MOCK_PATIENTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // --- Components ---
    const PatientCard = ({ patient, idx }) => {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className={cn(
                    "bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-primary-500/5 relative group overflow-hidden",
                    viewMode === 'list' ? "flex items-center justify-between p-4" : "flex flex-col items-center text-center"
                )}
            >
                {/* Adherence Progress Ring Background (Grid Mode) */}
                {viewMode === 'grid' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}

                {/* Quick Action Buttons Slide UP on Hover */}
                <div className={cn(
                    "absolute transition-all duration-300 flex items-center justify-center gap-2",
                    viewMode === 'grid'
                        ? "bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 bg-white/90 backdrop-blur-sm border-t border-slate-100"
                        : "right-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                )}>
                    <button className="p-2 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-500 hover:text-white transition-colors"><Phone size={18} /></button>
                    <button className="p-2 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-500 hover:text-white transition-colors"><Mail size={18} /></button>
                    <button className="p-2 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-500 hover:text-white transition-colors"><FileText size={18} /></button>
                </div>

                <div className={cn("relative z-10 flex", viewMode === 'list' ? "items-center gap-6" : "flex-col items-center w-full")}>
                    <div className="relative mb-4">
                        {/* SVG Progress Ring */}
                        <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                            <motion.circle
                                cx="50" cy="50" r="46" fill="none"
                                stroke={patient.adherence > 80 ? "#10b981" : patient.adherence > 60 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="4" strokeLinecap="round"
                                initial={{ strokeDasharray: "0 300" }}
                                animate={{ strokeDasharray: `${patient.adherence * 2.89} 300` }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                            />
                        </svg>
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-sm relative z-10 bg-slate-50">
                            <img src={patient.avatar} alt={patient.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        {/* Status Pulse */}
                        <div className={cn(
                            "absolute bottom-0 right-2 w-4 h-4 rounded-full border-2 border-white z-20",
                            patient.status === 'online' ? "bg-success animate-pulse-slow" : "bg-slate-300"
                        )}></div>
                    </div>

                    <div className={cn(viewMode === 'list' ? "text-left flex-1" : "")}>
                        <h3 className="text-xl font-heading font-bold text-slate-800">{patient.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">Adherence: <span className={cn(
                            "font-bold",
                            patient.adherence > 80 ? "text-success" : patient.adherence > 60 ? "text-warning" : "text-error"
                        )}>{patient.adherence}%</span></p>
                    </div>

                    <div className={cn(
                        "mt-4 py-2 px-4 rounded-xl bg-primary-50 border border-primary-100/50 flex items-center justify-center gap-2 transition-colors",
                        viewMode === 'list' && "mt-0 mr-32"
                    )}>
                        <Activity size={16} className="text-primary-500" />
                        <span className="text-sm font-bold text-primary-700">Next: {patient.nextDose}</span>
                    </div>
                </div>
            </motion.div>
        );
    };

    const SkeletonCard = () => (
        <div className={cn(
            "bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden",
            viewMode === 'list' ? "flex items-center gap-6" : "flex flex-col items-center text-center"
        )}>
            {/* Shimmer Effect */}
            <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent z-20"
            />
            <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 shrink-0"></div>
            <div className={cn("space-y-3", viewMode === 'list' ? "flex-1" : "w-full flex flex-col items-center")}>
                <div className="h-5 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            </div>
            <div className={cn("mt-4 h-10 bg-slate-100 rounded-xl w-full", viewMode === 'list' && "w-32 mt-0")}></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 z-20 relative">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-slate-800">Patients Directory</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage and monitor {MOCK_PATIENTS.length} active patients</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    {/* Animated Search */}
                    <motion.div
                        animate={{ width: searchFocused ? 300 : 200 }}
                        className="relative"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:outline-none transition-all font-medium text-slate-700"
                        />
                    </motion.div>

                    <button className="p-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center gap-2 font-bold text-sm">
                        <Filter size={18} /> <span className="hidden sm:inline">Filters</span>
                    </button>

                    {/* Toggle View Mode */}
                    <div className="flex p-1 bg-slate-100 rounded-xl relative ml-2">
                        <motion.div
                            layoutId="viewToggle"
                            className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{
                                left: viewMode === 'grid' ? '4px' : 'calc(50%)',
                            }}
                        />
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-1.5 rounded-lg z-10 transition-colors relative", viewMode === 'grid' ? "text-primary-600" : "text-slate-400 hover:text-slate-600")}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-lg z-10 transition-colors relative", viewMode === 'list' ? "text-primary-600" : "text-slate-400 hover:text-slate-600")}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Chips Slide Animation */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 overflow-x-auto pb-2"
            >
                {['All Patients', 'Critical Adherence', 'Missed Dose Today', 'Online Now'].map((chip, idx) => (
                    <button key={chip} className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                        idx === 0 ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600"
                    )}>
                        {chip}
                    </button>
                ))}
            </motion.div>

            {/* Main Grid/List Container */}
            <motion.div layout className={cn(
                "grid gap-6 auto-rows-max",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            )}>
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)
                    ) : filtered.length > 0 ? (
                        filtered.map((patient, idx) => (
                            <PatientCard key={patient.id} patient={patient} idx={idx} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-slate-200"
                        >
                            <div className="w-40 h-40 mb-6 relative">
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                                    <img src="https://api.dicebear.com/7.x/shapes/svg?seed=Empty" alt="No results" className="w-full h-full opacity-50 grayscale" />
                                </motion.div>
                                <Search className="absolute bottom-0 right-0 w-12 h-12 text-primary-300" />
                            </div>
                            <h3 className="text-xl font-heading font-bold text-slate-800">No patients found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">We couldn't find any patients matching "{searchQuery}". Try a different search term or adjust your filters.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-6 px-6 py-2 bg-primary-100 text-primary-700 font-bold rounded-xl hover:bg-primary-200 transition-colors"
                            >
                                Clear Search
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Pagination (Animated) */}
            {!isLoading && filtered.length > 0 && (
                <div className="flex justify-center mt-12 pb-8">
                    <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <button className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-700 disabled:opacity-50">Prev</button>
                        {[1, 2, 3, '...', 8].map((page, i) => (
                            <button
                                key={i}
                                className={cn(
                                    "w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-colors",
                                    page === 1 ? "bg-primary-600 text-white shadow-md shadow-primary-500/20" : "text-slate-600 hover:bg-slate-100"
                                )}
                                disabled={page === '...'}
                            >
                                {page}
                            </button>
                        ))}
                        <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">Next</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Patients;
