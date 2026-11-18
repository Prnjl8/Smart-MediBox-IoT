import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Pill, User, Stethoscope, Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Login = () => {
    const [activeTab, setActiveTab] = useState('family');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        }, 1500);
    };

    const formVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, staggerChildren: 0.1 } },
        exit: { opacity: 0, x: 20, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
            {/* Background Soft Gradients */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-30 bg-primary-200 blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 bg-accent-200 blur-3xl animate-pulse-slow delay-1000"></div>
                {/* Subtle pill pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTEwIDJDNS41IDIgMiA1LjUgMiAxMHMzLjUgOCA4IDggOC0zLjUgOC04LTMuNS04LTgtOHptMCAxNGMtMy4zIDAtNi0yLjctNi02czIuNy02IDYtNiA2IDIuNyA2IDYtMi43IDYtNiA2eiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] pointer-events-none mix-blend-multiply"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="glass-card overflow-hidden shadow-2xl shadow-primary-500/10">

                    <div className="p-8">
                        {/* Header / Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-16 h-16 bg-gradient-to-tr from-primary-500 to-accent-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30"
                            >
                                <Pill className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-heading font-bold text-slate-800 tracking-tight">Welcome Back</h1>
                            <p className="text-sm text-slate-500 mt-1">Smart Medicine Box Dashboard</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-100/80 rounded-xl mb-8 relative">
                            <div
                                className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
                                style={{
                                    left: activeTab === 'family' ? '4px' : 'calc(50%)',
                                }}
                            />
                            <button
                                onClick={() => setActiveTab('family')}
                                className={cn("flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 z-10 transition-colors", activeTab === 'family' ? "text-primary-600" : "text-slate-500 hover:text-slate-700")}
                            >
                                <User size={16} /> Family Login
                            </button>
                            <button
                                onClick={() => setActiveTab('doctor')}
                                className={cn("flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 z-10 transition-colors", activeTab === 'doctor' ? "text-primary-600" : "text-slate-500 hover:text-slate-700")}
                            >
                                <Stethoscope size={16} /> Doctor Login
                            </button>
                        </div>

                        {/* Form Container */}
                        <div className="relative min-h-[280px]">
                            <AnimatePresence mode="wait">
                                <motion.form
                                    key={activeTab}
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    onSubmit={handleLogin}
                                    className="absolute inset-0 w-full"
                                >
                                    <motion.div variants={itemVariants} className="mb-5 relative group">
                                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            placeholder={activeTab === 'family' ? "Family Email Address" : "Doctor ID / Email"}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700 shadow-sm"
                                        />
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="mb-6 relative group">
                                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="Password"
                                            className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700 shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                                        >
                                            {showPassword ? "HIDE" : "SHOW"}
                                        </button>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative w-5 h-5 rounded overflow-hidden border border-slate-300 bg-white group-hover:border-primary-400 transition-colors flex items-center justify-center">
                                                <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer peer" />
                                                <motion.div
                                                    className="w-full h-full bg-primary-500 scale-0 peer-checked:scale-100 flex items-center justify-center transition-transform origin-center"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                </motion.div>
                                            </div>
                                            <span className="text-sm text-slate-600 font-medium select-none group-hover:text-slate-800 transition-colors">Remember me</span>
                                        </label>

                                        <a href="#" className="flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group">
                                            Forgot Password<span className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all">?</span>
                                        </a>
                                    </motion.div>

                                    <motion.button
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.01, boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.4)" }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isLoading || isSuccess}
                                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold font-heading text-lg transition-all relative overflow-hidden group disabled:opacity-80 disabled:cursor-not-allowed"
                                        type="submit"
                                    >
                                        <div className="absolute inset-0 w-0 bg-white/20 group-hover:w-full transition-all duration-300 ease-out z-0"></div>
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSuccess ? (
                                                <>
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </motion.div>
                                                    Success!
                                                </>
                                            ) : isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Authenticating...
                                                </>
                                            ) : (
                                                `Sign in to Dashboard`
                                            )}
                                        </span>
                                    </motion.button>
                                </motion.form>
                            </AnimatePresence>
                        </div>

                    </div>

                    <div className="bg-slate-50 py-4 px-8 text-center border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">
                            New to MediBox? <a href="#" className="text-primary-600 font-bold hover:underline ml-1">Create an account</a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
