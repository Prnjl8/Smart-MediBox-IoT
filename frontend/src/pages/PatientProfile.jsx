import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Calendar, History, Bell, Edit2, Plus,
    Phone, Mail, AlertTriangle, Activity, CalendarCheck, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useParams } from 'react-router-dom';

const TABS = [
    { id: 'info', label: 'Overview & Info', icon: Heart },
    { id: 'schedule', label: 'Active Schedule', icon: Calendar },
    { id: 'history', label: 'Dose History', icon: History },
    { id: 'alerts', label: 'Recent Alerts', icon: Bell }
];

const PatientProfile = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('info');
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="max-w-6xl mx-auto pb-12">

            {/* Cover Photo Parallax */}
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-24 shadow-xl shadow-primary-500/10">
                <motion.div
                    style={{ y: scrollY * 0.4 }}
                    className="absolute inset-0 bg-cover bg-center"
                >
                    {/* Abstract cover generated with gradients */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 bg-pill-pattern opacity-10 mix-blend-overlay"></div>
                    </div>
                </motion.div>

                {/* Cover Actions */}
                <div className="absolute top-6 right-6 flex gap-2">
                    <button className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl text-white transition-all">
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>

            {/* Profile Header (Overlapping Cover) */}
            <div className="px-6 md:px-12 flex flex-col md:flex-row items-center md:items-end gap-6 relative -mt-36 z-10 mb-12">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-40 h-40 rounded-full border-8 border-primary-50 bg-white shadow-2xl overflow-hidden relative group">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane&backgroundColor=b6e3f4" alt="Jane Doe" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="text-white w-8 h-8 group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                    </div>
                    {/* Status Pulse */}
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-success rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-success animate-ping opacity-75 absolute"></div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-center md:text-left mb-2 md:mb-6">
                    <h1 className="text-4xl font-heading font-bold text-slate-800">Jane Doe</h1>
                    <p className="text-slate-500 font-medium mt-1 text-lg">ID: P-84729 • 64 years old • Female</p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 md:mb-6">
                    <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2">
                        <CalendarCheck size={18} /> New Schedule
                    </button>
                    <button className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-primary-600 rounded-xl shadow-sm transition-all group">
                        <MoreVertical size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">

                {/* Left Column: Navigation & Quick Stats */}
                <div className="space-y-6">

                    {/* Animated Tabs (Vertical) */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group w-full text-left",
                                    activeTab === tab.id ? "text-primary-700" : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabProfile"
                                        className="absolute inset-0 bg-primary-50 rounded-2xl border border-primary-100/50"
                                    />
                                )}
                                <tab.icon size={18} className={cn("relative z-10 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-primary-600" : "")} />
                                <span className="relative z-10">{tab.label}</span>
                                {tab.id === 'alerts' && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-error animate-pulse-slow"></span>}
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats Dashboard */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-heading font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity className="text-primary-500" /> Compliance Overview
                        </h3>

                        <div className="flex justify-center mb-6 relative">
                            {/* Circular Progress SVG */}
                            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                <motion.circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 300" }}
                                    animate={{ strokeDasharray: `${92 * 2.51} 300` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-heading font-bold text-slate-800">92%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taken</p>
                                <p className="text-2xl font-bold text-slate-800">142</p>
                            </div>
                            <div className="bg-error/5 rounded-2xl p-4 text-center">
                                <p className="text-xs font-bold text-error uppercase tracking-wider mb-1">Missed</p>
                                <p className="text-2xl font-bold text-error flex items-center justify-center gap-1">
                                    3 <AlertTriangle size={14} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tab Content Array */}
                <div className="col-span-1 lg:col-span-2">
                    <AnimatePresence mode="wait">

                        {/* INFO TAB */}
                        {activeTab === 'info' && (
                            <motion.div
                                key="info-content"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >

                                {/* Medical Conditions Tags */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800 font-heading">Medical Conditions</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'].map((cond, idx) => (
                                            <div key={cond} className="group relative">
                                                <span className="px-4 py-2 bg-primary-50 text-primary-700 font-bold text-sm rounded-xl border border-primary-100 inline-block cursor-default">
                                                    {cond}
                                                </span>
                                                {/* Hover Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                    Diagnosed: 2021. Managed with Metformin and lifestyle changes.
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 text-xs"></div>
                                                </div>
                                            </div>
                                        ))}
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95, translateY: 4 }} className="px-4 py-2 bg-slate-50 text-slate-500 font-bold text-sm rounded-xl border border-dashed border-slate-300 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center gap-1">
                                            <Plus size={16} /> Add
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Emergency Contacts Flip Cards */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-800 font-heading mb-4">Emergency Contacts</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: 'John Doe', rel: 'Son', phone: '+1 234 567 8900' },
                                            { name: 'Dr. Sarah Smith', rel: 'Primary Care', phone: '+1 987 654 3210' }
                                        ].map(contact => (
                                            <div key={contact.name} className="relative h-24 rounded-2xl perspective-1000 group">
                                                {/* Inner container for flip */}
                                                <div className="absolute inset-0 w-full h-full transition-all duration-500 transform-style-3d group-hover:rotate-x-180">

                                                    {/* Front */}
                                                    <div className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between backface-hidden">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{contact.name}</h4>
                                                            <p className="text-sm text-slate-500 font-medium">{contact.rel}</p>
                                                        </div>
                                                        <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group/btn pointer-events-none">
                                                            <Phone size={18} className="text-primary-500 group-hover/btn:animate-[wiggle_0.3s_ease-in-out_infinite]" />
                                                        </button>
                                                    </div>

                                                    {/* Back */}
                                                    <div className="absolute inset-0 w-full h-full bg-primary-600 text-white rounded-2xl p-4 flex items-center justify-center backface-hidden rotate-x-180">
                                                        <p className="font-heading font-bold text-lg">{contact.phone}</p>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Detailed Info Cards with Expand */}
                                <div className="bg-white rounded-3xl p-0 shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-6 border-b border-slate-50 flex justify-between items-center group/header hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div>
                                            <h3 className="font-bold text-slate-800 font-heading">Personal Information</h3>
                                            <p className="text-sm text-slate-500">Address, DOB, Blood Type</p>
                                        </div>
                                        <ChevronDownIcon className="w-5 h-5 text-slate-400 group-hover/header:text-primary-500 transition-colors" />
                                    </div>
                                    {/* Expandable simulated state */}
                                    <div className="p-6 bg-slate-50/50 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Type</p>
                                            <p className="font-bold text-slate-800">O+</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Height & Weight</p>
                                            <p className="font-bold text-slate-800">5'4" • 142 lbs</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                                            <p className="font-bold text-slate-800">123 Meadow Lane, Springfield, IL 62704</p>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        )}

                        {/* OTHER TABS STUBS */}
                        {activeTab !== 'info' && (
                            <motion.div
                                key="other-tabs"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center text-slate-400"
                            >
                                <Clock size={48} className="mb-4 opacity-50" />
                                <h3 className="text-xl font-heading font-bold text-slate-600 mb-2">Detailed {TABS.find(t => t.id === activeTab).label}</h3>
                                <p className="max-w-sm">This section aggregates the data for the patient's {activeTab}.</p>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Helper SVG
const ChevronDownIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6" /></svg>
);

export default PatientProfile;
