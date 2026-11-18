import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, Bell, User, Shield,
    Smartphone, Volume2, Save, UploadCloud, RotateCcw, AlertOctagon
} from 'lucide-react';
import { cn } from '../lib/utils';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('notifications');
    const [loadingSave, setLoadingSave] = useState(false);

    // Toggles state
    const [toggles, setToggles] = useState({
        pushNotes: true,
        emailAlerts: false,
        smsAlerts: true,
        highContrast: false,
        soundEnabled: true
    });

    const handleToggle = (key) => {
        // Haptic feedback simulation via browser API if available
        if (navigator.vibrate) navigator.vibrate(50);
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        setLoadingSave(true);
        setTimeout(() => setLoadingSave(false), 1500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shrink-0">
                    <SettingsIcon size={24} />
                </motion.div>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-800">Settings</h1>
                    <p className="text-slate-500 font-medium">Manage your system preferences and profile.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* Sidebar Nav */}
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    {[
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'profile', label: 'Profile Settings', icon: User },
                        { id: 'device', label: 'MediBox Device', icon: Smartphone },
                        { id: 'security', label: 'Security & Sync', icon: Shield }
                    ].map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                                activeSection === section.id
                                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                            )}
                        >
                            <section.icon size={18} />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Content Area flex-1 */}
                <div className="flex-1 space-y-6">
                    <AnimatePresence mode="wait">

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                                    <h3 className="font-heading font-bold text-slate-800 text-xl border-b border-slate-100 pb-4 mb-4">Alert Preferences</h3>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'pushNotes', label: 'Push Notifications', desc: 'Receive alerts on your browser/device' },
                                            { key: 'emailAlerts', label: 'Email Summaries', desc: 'Daily digest of adherence stats' },
                                            { key: 'smsAlerts', label: 'SMS Warnings', desc: 'Emergency text messages for missed doses' },
                                            { key: 'soundEnabled', label: 'Alert Sounds', desc: 'Play sounds for critical alerts', hasPreview: true }
                                        ].map(item => (
                                            <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800">{item.label}</h4>
                                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                                    {item.hasPreview && (
                                                        <button className="mt-2 text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
                                                            <Volume2 size={12} /> Preview Sound
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Custom Toggle Switch */}
                                                <button
                                                    onClick={() => handleToggle(item.key)}
                                                    className={cn(
                                                        "w-12 h-6 rounded-full relative transition-colors duration-300 ml-4",
                                                        toggles[item.key] ? "bg-success" : "bg-slate-300"
                                                    )}
                                                >
                                                    <motion.div
                                                        className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm"
                                                        animate={{ left: toggles[item.key] ? '26px' : '4px' }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Simulated Interactive Preview */}
                                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-3xl p-6 shadow-sm border border-primary-100">
                                    <h4 className="font-bold text-primary-800 mb-4 flex items-center gap-2"><Smartphone size={18} /> Live Device Preview</h4>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary-100/50 max-w-sm mx-auto flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                            <Bell className={cn("w-5 h-5", toggles.pushNotes ? "animate-[wiggle_1s_ease-in-out_infinite]" : "opacity-30")} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">Example Alert</p>
                                            <p className="text-xs text-slate-500">This is how a notification will appear.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <h3 className="font-heading font-bold text-slate-800 text-xl border-b border-slate-100 pb-4 mb-6">Profile Details</h3>

                                    {/* Avatar Upload */}
                                    <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-slate-50">
                                        <div className="w-32 h-32 rounded-full border-4 border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Doc" alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <div className="border-2 border-dashed border-primary-200 bg-primary-50/50 rounded-2xl p-6 text-center hover:bg-primary-50 hover:border-primary-400 transition-colors cursor-pointer group">
                                                <UploadCloud className="w-8 h-8 text-primary-400 mx-auto mb-2 group-hover:text-primary-600 transition-colors group-hover:-translate-y-1" />
                                                <p className="text-sm font-bold text-primary-700">Drag & drop new image here</p>
                                                <p className="text-xs text-primary-400 mt-1">or click to browse from computer</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                                            <input type="text" defaultValue="Dr. John" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none font-bold text-slate-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                                            <input type="text" defaultValue="Smith" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none font-bold text-slate-700" />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-1 mt-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                                            <input type="email" defaultValue="dr.smith@medibox.app" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-400 focus:outline-none font-bold text-slate-700" />
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-error/5 border border-error/20 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-3xl"></div>
                                    <h3 className="font-heading font-bold text-error text-xl mb-2 flex items-center gap-2">
                                        <AlertOctagon size={20} /> Danger Zone
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-6">Deactivating this account will erase all schedule data from synced MediBox devices permanently.</p>

                                    <motion.button
                                        whileHover={{ scale: 1.02, x: [0, -2, 2, -2, 2, 0] }} // Shake on hover outline
                                        className="px-6 py-2.5 bg-error text-white font-bold rounded-xl shadow-md shadow-error/20"
                                    >
                                        Deactivate Account
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Other Sections Stubs */}
                        {!['notifications', 'profile'].includes(activeSection) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-400 font-medium">
                                Settings panel for {activeSection} not fully implemented yet.
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Persistent Action Bar */}
                    <div className="sticky bottom-6 bg-slate-800 p-4 rounded-2xl shadow-xl flex justify-between items-center text-white z-20 mt-8">
                        <button className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-colors">
                            <RotateCcw size={16} /> Reset
                        </button>

                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 relative overflow-hidden"
                        >
                            {loadingSave ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Saving...
                                    <span className="absolute inset-0 bg-primary-600 opacity-50 animate-pulse"></span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
