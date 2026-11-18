import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    History,
    PlusCircle,
    Settings,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Pill,
    Camera,
    ScanBarcode,
    Layers,
    Cpu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Layers,          label: 'Slot Management', path: '/slots' },
    { icon: Cpu,             label: 'Box Simulator', path: '/box-twin' },
    { icon: PlusCircle,      label: 'Add Schedule', path: '/add-schedule' },
    { icon: BarChart3,       label: 'Reports & AI', path: '/reports' },
    { icon: Users,           label: 'Patients', path: '/patients' },
    { icon: CalendarDays,    label: 'Calendar', path: '/calendar' },
    { icon: History,         label: 'History', path: '/history' },
    { icon: Camera,          label: 'Vision System', path: '/vision' },
    { icon: ScanBarcode,     label: 'Box Scanner',   path: '/box-scanner' },
    { icon: Settings,        label: 'Settings',       path: '/settings' },
];

export const Sidebar = ({ collapsed, setCollapsed }) => {
    const location = useLocation();

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-surface-dark text-white flex flex-col relative z-20 shadow-2xl"
        >
            <div className="flex items-center justify-between p-4 h-20 border-b border-white/10">
                <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center w-full")}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <Pill className="w-8 h-8 text-primary-400 shrink-0" />
                    </motion.div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-heading font-bold text-xl whitespace-nowrap"
                        >
                            MediBox
                        </motion.span>
                    )}
                </div>
            </div>

            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-24 bg-primary-600 text-white rounded-full p-1 shadow-lg hover:bg-primary-500 hover:scale-110 transition-all z-30"
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "relative flex items-center p-3 rounded-xl transition-all duration-200 group overflow-hidden",
                                isActive
                                    ? "bg-primary-600/20 text-primary-400"
                                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                                collapsed ? "justify-center" : "justify-start gap-4"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBadge"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-400 rounded-r-md"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />

                            {!collapsed && (
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className={cn("p-4 border-t border-white/10", collapsed && "items-center flex flex-col")}>
                {!collapsed ? (
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-4 text-white hover:shadow-lg hover:-translate-y-1 transition-all">
                        <h4 className="font-bold flex items-center gap-2 font-heading">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></span>
                            Emergency Mode
                        </h4>
                        <p className="text-xs text-primary-100 mt-1">System is online</p>
                    </div>
                ) : (
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse-slow ml-1" title="System Online (Hover)"></div>
                )}
            </div>
        </motion.aside>
    );
};
