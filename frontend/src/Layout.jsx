import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobileAppShell from './components/layout/MobileAppShell';

const Layout = () => {
  const location = useLocation();

  // Don't show shell on login page
  if (location.pathname === '/login') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-slate-900"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Redirect root to dashboard
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MobileAppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </MobileAppShell>
  );
};

export default Layout;
