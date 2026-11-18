import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Clock, Plus, X, GripVertical, CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';
import { cn } from '../lib/utils';

// --- Stub Data ---
const getStatusColor = (status) => {
    switch (status) {
        case 'taken': return 'bg-success';
        case 'missed': return 'bg-error';
        case 'pending': return 'bg-warning';
        default: return 'bg-slate-300';
    }
};

const MED_DATA = {
    // Simulating dummy data mapping 'yyyy-MM-dd' to an array of doses
};
// Pre-fill some data for current month
const now = new Date();
for (let i = 1; i <= 31; i++) {
    if (Math.random() > 0.3) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = format(d, 'yyyy-MM-dd');
        MED_DATA[dateStr] = [
            { id: '1', med: 'Aspirin', time: '08:00 AM', status: Math.random() > 0.5 ? 'taken' : (d < now ? 'missed' : 'pending') },
            ...(Math.random() > 0.5 ? [{ id: '2', med: 'Metformin', time: '08:00 PM', status: d < now ? 'taken' : 'pending' }] : [])
        ];
    }
}

const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);

    // Calendar logic
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;
            const dateStr = format(cloneDay, 'yyyy-MM-dd');
            const doses = MED_DATA[dateStr] || [];

            days.push(
                <motion.div
                    key={day.toString()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setSelectedDate(cloneDay);
                        setShowModal(true);
                    }}
                    className={cn(
                        "h-24 md:h-32 border border-slate-100 p-2 flex flex-col items-center md:items-start group transition-all duration-300 cursor-pointer overflow-hidden relative",
                        !isSameMonth(day, monthStart) ? "bg-slate-50 text-slate-300" : "bg-white text-slate-700",
                        isSameDay(day, selectedDate) ? "border-primary-400 bg-primary-50 ring-2 ring-primary-300 ring-inset" : "",
                        isToday(day) ? "border-accent-400 bg-accent-50/30" : "hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 hover:z-10"
                    )}
                >
                    {isToday(day) && <div className="absolute top-0 right-0 w-8 h-8 bg-accent-400 -rotate-45 translate-x-4 -translate-y-4"></div>}

                    <span className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-1",
                        isSameDay(day, currentDate) ? "" : "",
                        isToday(day) ? "bg-accent-500 text-white shadow-md shadow-accent-500/30" : "group-hover:text-primary-600"
                    )}>
                        {formattedDate}
                    </span>

                    <div className="flex flex-col gap-1 w-full mt-1">
                        {doses.slice(0, 2).map((dose, i) => (
                            <div key={i} className="hidden md:flex items-center gap-1.5 w-full">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(dose.status)}`} />
                                <span className="text-xs truncate font-medium text-slate-600">{dose.med}</span>
                            </div>
                        ))}
                        {/* Mobile dots */}
                        <div className="flex justify-center md:hidden gap-1 mt-1">
                            {doses.slice(0, 3).map((dose, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${getStatusColor(dose.status)}`} />
                            ))}
                        </div>
                        {doses.length > 2 && <span className="text-[10px] text-slate-400 font-bold hidden md:block">+ {doses.length - 2} more</span>}
                    </div>
                </motion.div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7 w-full" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col relative z-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 border border-slate-200 p-1.5 rounded-2xl bg-slate-50">
                        <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <h2 className="text-xl font-heading font-bold text-slate-800 min-w-[140px] text-center">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                            <ChevronRight size={20} className="text-slate-600" />
                        </button>
                    </div>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="hidden md:block px-4 py-2 bg-primary-100 text-primary-700 font-bold rounded-xl hover:bg-primary-200 transition-colors"
                    >
                        Today
                    </button>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl relative">
                    <div
                        className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
                        style={{ left: viewMode === 'month' ? '4px' : 'calc(50%)' }}
                    />
                    <button
                        onClick={() => setViewMode('month')}
                        className={cn("px-6 py-2 text-sm font-bold z-10 transition-colors", viewMode === 'month' ? "text-primary-600" : "text-slate-500 hover:text-slate-700")}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={cn("px-6 py-2 text-sm font-bold z-10 transition-colors", viewMode === 'week' ? "text-primary-600" : "text-slate-500 hover:text-slate-700")}
                    >
                        Week
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                    {weekDays.map(day => (
                        <div key={day} className="py-4 text-center text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Cells */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentDate.toString() + viewMode}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 overflow-y-auto"
                    >
                        {rows}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all z-40"
            >
                <Plus size={28} />
            </motion.button>

            {/* Day Detail Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="bg-primary-600 p-6 text-white relative">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute p-2 right-4 top-4 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-2xl font-bold">{format(selectedDate, 'd MMMM, yyyy')}</h3>
                                        <p className="text-primary-100 font-medium text-sm">{format(selectedDate, 'EEEE')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content - Timeline view for the day */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50">
                                <h4 className="font-bold text-slate-500 text-sm mb-4 uppercase tracking-wider pl-4">Scheduled Doses</h4>

                                {MED_DATA[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
                                    <div className="space-y-4 relative">
                                        {/* Continuous vertical line connecting timeline entries */}
                                        <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-slate-200 z-0"></div>

                                        {MED_DATA[format(selectedDate, 'yyyy-MM-dd')].map((dose, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="flex gap-4 relative z-10 group"
                                            >
                                                {/* Status Node */}
                                                <div className="w-[52px] h-[52px] shrink-0 outline outline-4 outline-slate-50 rounded-full flex justify-center items-center bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                                                    {dose.status === 'taken' ? <CheckCircle2 className="text-success" size={24} /> :
                                                        dose.status === 'missed' ? <AlertCircle className="text-error" size={24} /> :
                                                            <div className="w-12 h-12 relative flex items-center justify-center">
                                                                <Clock className="w-6 h-6 text-warning" />
                                                                {/* Mock Analog hands animation via CSS (omitted for brevity) */}
                                                            </div>
                                                    }
                                                </div>

                                                {/* Card Entry with Drag Handle Simulation */}
                                                <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group-hover:border-primary-200 transition-all cursor-move">
                                                    <GripVertical size={16} className="text-slate-300" />
                                                    <div className={cn("w-1.5 self-stretch rounded-full", getStatusColor(dose.status))}></div>
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-slate-800">{dose.med}</h5>
                                                        <span className="text-sm font-bold text-slate-500">{dose.time}</span>
                                                    </div>

                                                    {dose.status === 'pending' && (
                                                        <button className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 font-bold rounded-lg text-xs relative overflow-hidden group/btn">
                                                            <span className="relative z-10">Take</span>
                                                            <span className="absolute inset-0 bg-primary-600 origin-center scale-0 group-hover/btn:scale-100 transition-transform duration-300 rounded-lg"></span>
                                                            <span className="absolute inset-0 text-white flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity z-20 font-bold">Now</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center text-center opacity-70">
                                        <CalendarIcon size={48} className="text-slate-300 mb-4" />
                                        <p className="font-bold text-slate-500">No doses scheduled</p>
                                        <button className="mt-4 px-4 py-2 bg-primary-100 text-primary-700 font-bold text-sm rounded-xl">Add Schedule</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default CalendarView;
