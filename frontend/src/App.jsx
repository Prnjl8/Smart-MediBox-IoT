import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import Patients from './pages/Patients';
import CalendarView from './pages/CalendarView';
import History from './pages/History';
import AddSchedule from './pages/AddSchedule';
import PatientProfile from './pages/PatientProfile';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import VisionVerification from './pages/VisionVerification';
import BoxScanner from './pages/BoxScanner';
import SlotManagement from './pages/SlotManagement';
import SmartBoxTwin from './pages/SmartBoxTwin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/slots" element={<SlotManagement />} />
          <Route path="/box-twin" element={<SmartBoxTwin />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/history" element={<History />} />
          <Route path="/add-schedule" element={<AddSchedule />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/vision" element={<VisionVerification />} />
          <Route path="/box-scanner" element={<BoxScanner />} />
          <Route path="*" element={<div className="p-4 text-2xl font-heading text-error">404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
