import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, X, AlertTriangle, Phone, MapPin, Radio, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

export const VoiceInterface = ({ isOpen, onClose }) => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsListening(true);
            setTranscript('');
            // Typewriter simulation
            const text = "Schedule Aspirin for tomorrow morning at 8";
            let i = 0;
            const timer = setInterval(() => {
                setTranscript(text.substring(0, i));
                i++;
                if (i > text.length) {
                    clearInterval(timer);
                    setIsListening(false);
                    setTimeout(() => onClose(), 2000);
                }
            }, 50);
            return () => clearInterval(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end p-8 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col items-center relative overflow-hidden"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="relative mb-6 mt-4">
                            {isListening && (
                                <>
                                    <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20 scale-150"></div>
                                    <div className="absolute inset-0 bg-primary-400 rounded-full animate-pulse opacity-40 scale-110"></div>
                                </>
                            )}
                            <div className={cn(
                                "relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500",
                                isListening ? "bg-primary-500 text-white" : "bg-success text-white"
                            )}>
                                {isListening ? <Mic size={32} /> : <CheckCircle2 size={32} />}
                            </div>
                        </div>

                        <div className="h-16 flex items-center justify-center px-4 w-full text-center">
                            <p className="font-heading text-xl text-white font-medium">
                                {transcript}
                                {isListening && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>|</motion.span>}
                            </p>
                        </div>

                        {/* Voice Wave Animation Stub */}
                        {isListening && (
                            <div className="flex items-end gap-1 h-8 mt-4">
                                {[...Array(15)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: ['20%', '100%', '30%', '80%', '40%'] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                                        className="w-1.5 bg-primary-400 rounded-full"
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export const EmergencyBanner = ({ isActive, onDismiss }) => {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        let timer;
        if (isActive && countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isActive, countdown]);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-error text-white shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTEwIDJDNS41IDIgMiA1LjUgMiAxMHMzLjUgOCA4IDggOC0zLjUgOC04LTMuNS04LTgtOHptMCAxNGMtMy4zIDAtNi0yLjctNi02czIuNy02IDYtNiA2IDIuNyA2IDYtMi43IDYtNiA2eiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] opacity-10 mix-blend-overlay"></div>

                    <div className="max-w-7xl mx-auto px-6 py-4 relative flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-error animate-pulse shadow-lg shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-heading font-bold flex items-center gap-2 text-white">
                                    <Radio size={18} className="animate-[wiggle_1s_ease-in-out_infinite]" /> EMERGENCY ALERT
                                </h2>
                                <p className="text-white/90 font-medium text-sm">Patient Jane Doe manually triggered SOS. Heart rate anomaly detected.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <button className="whitespace-nowrap px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-2 transition-colors">
                                <Phone size={18} /> Call 911 <span className="bg-white text-error px-2 py-0.5 rounded-lg text-xs ml-1">{countdown}s</span>
                            </button>
                            <button className="whitespace-nowrap px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-2 transition-colors">
                                <Phone size={18} /> John (Son)
                            </button>
                            <button className="whitespace-nowrap px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-2 transition-colors">
                                <MapPin size={18} /> Locate
                            </button>
                        </div>

                        <button onClick={onDismiss} className="absolute top-2 right-2 text-white/50 hover:text-white p-2">
                            <X size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
