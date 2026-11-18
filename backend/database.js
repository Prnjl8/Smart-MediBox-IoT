import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data_store.json');

// Initial seed data representing a fully operational Smart MediBox deployment
const SEED_DATA = {
  system: {
    boxId: 'BOX-MED-8491',
    boxName: 'Living Room Smart Box',
    firmwareVersion: 'v2.4.1-esp32',
    status: 'online',
    batteryPct: 94,
    wifiRssi: -58,
    temperatureC: 22.4,
    humidityPct: 45.2,
    lastHeartbeat: new Date().toISOString(),
  },
  patients: [
    {
      id: 'p-1',
      name: 'Robert Vance',
      age: 74,
      condition: 'Hypertension & Type 2 Diabetes',
      primaryDoctor: 'Dr. Sarah Mitchell, MD (Cardiology)',
      doctorContact: '+1 (555) 382-9012',
      doctorEmail: 'dr.mitchell@metrohealth.org',
      familyContactName: 'Clara Vance (Daughter)',
      familyPhone: '+1 (555) 729-4401',
      familyEmail: 'clara.vance@example.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  ],
  medicines: [
    {
      id: 'med-1',
      name: 'Metformin',
      dosage: '500mg',
      type: 'Tablet',
      pillColor: '#10b981', // Emerald
      pillShape: 'Oval',
      instructions: 'Take with morning meal. Do not crush.',
      safeTempMax: 28,
      safeHumidityMax: 65,
    },
    {
      id: 'med-2',
      name: 'Lisinopril',
      dosage: '10mg',
      type: 'Tablet',
      pillColor: '#f59e0b', // Amber
      pillShape: 'Round',
      instructions: 'Take in the morning for blood pressure control.',
      safeTempMax: 26,
      safeHumidityMax: 60,
    },
    {
      id: 'med-3',
      name: 'Atorvastatin',
      dosage: '20mg',
      type: 'Tablet',
      pillColor: '#6366f1', // Indigo
      pillShape: 'Oval',
      instructions: 'Take once daily in the evening at bedtime.',
      safeTempMax: 25,
      safeHumidityMax: 55,
    },
    {
      id: 'med-4',
      name: 'Vitamin D3',
      dosage: '2000 IU',
      type: 'Capsule',
      pillColor: '#ec4899', // Pink
      pillShape: 'Capsule',
      instructions: 'Take with lunch or afternoon meal.',
      safeTempMax: 30,
      safeHumidityMax: 70,
    },
  ],
  slots: [
    {
      slotId: 1,
      medicineId: 'med-1',
      medicineName: 'Metformin 500mg',
      pillCapacity: 30,
      currentCount: 18,
      refillThreshold: 5,
      pillColor: '#10b981',
      pillShape: 'Oval',
      ledColor: '#10b981',
      isUnlocked: false,
      isLidOpen: false,
      status: 'ready', // ready | alerting | open | low_stock
      lastDispensedAt: '2026-11-04T08:02:15.000Z',
    },
    {
      slotId: 2,
      medicineId: 'med-2',
      medicineName: 'Lisinopril 10mg',
      pillCapacity: 30,
      currentCount: 4, // Intentionally low to trigger Refill Warning demo!
      refillThreshold: 5,
      pillColor: '#f59e0b',
      pillShape: 'Round',
      ledColor: '#f59e0b',
      isUnlocked: false,
      isLidOpen: false,
      status: 'low_stock',
      lastDispensedAt: '2026-11-04T08:03:00.000Z',
    },
    {
      slotId: 3,
      medicineId: 'med-3',
      medicineName: 'Atorvastatin 20mg',
      pillCapacity: 30,
      currentCount: 22,
      refillThreshold: 5,
      pillColor: '#6366f1',
      pillShape: 'Oval',
      ledColor: '#6366f1',
      isUnlocked: false,
      isLidOpen: false,
      status: 'ready',
      lastDispensedAt: '2026-11-03T21:04:12.000Z',
    },
    {
      slotId: 4,
      medicineId: 'med-4',
      medicineName: 'Vitamin D3 2000 IU',
      pillCapacity: 60,
      currentCount: 35,
      refillThreshold: 8,
      pillColor: '#ec4899',
      pillShape: 'Capsule',
      ledColor: '#ec4899',
      isUnlocked: false,
      isLidOpen: false,
      status: 'ready',
      lastDispensedAt: '2026-11-03T13:01:45.000Z',
    },
    {
      slotId: 5,
      medicineId: null,
      medicineName: 'Empty Compartment',
      pillCapacity: 30,
      currentCount: 0,
      refillThreshold: 5,
      pillColor: '#94a3b8',
      pillShape: 'Empty',
      ledColor: '#94a3b8',
      isUnlocked: false,
      isLidOpen: false,
      status: 'empty',
      lastDispensedAt: null,
    },
    {
      slotId: 6,
      medicineId: null,
      medicineName: 'Empty Compartment',
      pillCapacity: 30,
      currentCount: 0,
      refillThreshold: 5,
      pillColor: '#94a3b8',
      pillShape: 'Empty',
      ledColor: '#94a3b8',
      isUnlocked: false,
      isLidOpen: false,
      status: 'empty',
      lastDispensedAt: null,
    },
  ],
  schedules: [
    {
      id: 'sch-1',
      patientId: 'p-1',
      slotId: 1,
      medicineName: 'Metformin 500mg',
      time: '08:00 AM',
      time24: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      doseCount: 1,
      soundPreset: 'gentle_chime',
      isActive: true,
    },
    {
      id: 'sch-2',
      patientId: 'p-1',
      slotId: 2,
      medicineName: 'Lisinopril 10mg',
      time: '08:00 AM',
      time24: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      doseCount: 1,
      soundPreset: 'voice_prompt',
      isActive: true,
    },
    {
      id: 'sch-3',
      patientId: 'p-1',
      slotId: 4,
      medicineName: 'Vitamin D3 2000 IU',
      time: '01:00 PM',
      time24: '13:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      doseCount: 1,
      soundPreset: 'gentle_chime',
      isActive: true,
    },
    {
      id: 'sch-4',
      patientId: 'p-1',
      slotId: 3,
      medicineName: 'Atorvastatin 20mg',
      time: '09:00 PM',
      time24: '21:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      doseCount: 1,
      soundPreset: 'voice_prompt',
      isActive: true,
    },
  ],
  doseLogs: [
    {
      id: 'log-101',
      scheduleId: 'sch-1',
      slotId: 1,
      patientId: 'p-1',
      medicineName: 'Metformin 500mg',
      date: '2026-11-04',
      scheduledTime: '08:00 AM',
      triggeredAt: '2026-11-04T08:00:00.000Z',
      dispensedAt: '2026-11-04T08:02:15.000Z',
      status: 'taken',
      delayMinutes: 2,
      weightDeltaGrams: 0.85,
      pillVerificationScore: 0.98,
    },
    {
      id: 'log-102',
      scheduleId: 'sch-2',
      slotId: 2,
      patientId: 'p-1',
      medicineName: 'Lisinopril 10mg',
      date: '2026-11-04',
      scheduledTime: '08:00 AM',
      triggeredAt: '2026-11-04T08:00:00.000Z',
      dispensedAt: '2026-11-04T08:03:00.000Z',
      status: 'taken',
      delayMinutes: 3,
      weightDeltaGrams: 0.32,
      pillVerificationScore: 0.95,
    },
    {
      id: 'log-103',
      scheduleId: 'sch-3',
      slotId: 4,
      patientId: 'p-1',
      medicineName: 'Vitamin D3 2000 IU',
      date: '2026-11-03',
      scheduledTime: '01:00 PM',
      triggeredAt: '2026-11-03T13:00:00.000Z',
      dispensedAt: '2026-11-03T13:01:45.000Z',
      status: 'taken',
      delayMinutes: 1,
      weightDeltaGrams: 0.45,
      pillVerificationScore: 0.99,
    },
    {
      id: 'log-104',
      scheduleId: 'sch-4',
      slotId: 3,
      patientId: 'p-1',
      medicineName: 'Atorvastatin 20mg',
      date: '2026-11-03',
      scheduledTime: '09:00 PM',
      triggeredAt: '2026-11-03T21:00:00.000Z',
      dispensedAt: null,
      status: 'missed',
      delayMinutes: 15,
      weightDeltaGrams: 0,
      pillVerificationScore: 0,
      reason: 'Grace period timeout (patient away from box)',
    },
    {
      id: 'log-105',
      scheduleId: 'sch-1',
      slotId: 1,
      patientId: 'p-1',
      medicineName: 'Metformin 500mg',
      date: '2026-11-03',
      scheduledTime: '08:00 AM',
      triggeredAt: '2026-11-03T08:00:00.000Z',
      dispensedAt: '2026-11-03T08:04:10.000Z',
      status: 'taken',
      delayMinutes: 4,
      weightDeltaGrams: 0.85,
      pillVerificationScore: 0.97,
    },
    {
      id: 'log-106',
      scheduleId: 'sch-2',
      slotId: 2,
      patientId: 'p-1',
      medicineName: 'Lisinopril 10mg',
      date: '2026-11-02',
      scheduledTime: '08:00 AM',
      triggeredAt: '2026-11-02T08:00:00.000Z',
      dispensedAt: '2026-11-02T08:01:20.000Z',
      status: 'taken',
      delayMinutes: 1,
      weightDeltaGrams: 0.32,
      pillVerificationScore: 0.99,
    },
    {
      id: 'log-107',
      scheduleId: 'sch-4',
      slotId: 3,
      patientId: 'p-1',
      medicineName: 'Atorvastatin 20mg',
      date: '2026-11-02',
      scheduledTime: '09:00 PM',
      triggeredAt: '2026-11-02T21:00:00.000Z',
      dispensedAt: '2026-11-02T21:28:00.000Z',
      status: 'taken',
      delayMinutes: 28, // Frequent evening delay pattern
      weightDeltaGrams: 0.50,
      pillVerificationScore: 0.94,
    },
  ],
  alerts: [
    {
      id: 'alt-1',
      type: 'refill_warning',
      severity: 'warning',
      recipient: 'Pharmacy & Family Member',
      title: 'Low Medication Stock in Slot 2',
      message: 'Lisinopril 10mg has only 4 doses remaining (Refill threshold: 5). Auto-refill requested.',
      slotId: 2,
      createdAt: '2026-11-04T08:03:05.000Z',
      resolved: false,
    },
    {
      id: 'alt-2',
      type: 'missed_dose',
      severity: 'emergency',
      recipient: 'Dr. Sarah Mitchell & Clara Vance',
      title: 'Missed Dose: Atorvastatin 20mg (Slot 3)',
      message: 'Robert Vance missed the 9:00 PM dose. Lid was not opened within the 10-minute grace window.',
      slotId: 3,
      createdAt: '2026-11-03T21:10:00.000Z',
      resolved: true,
    },
  ],
  aiReports: [],
};

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(SEED_DATA));
        this.save();
      }
    } catch (err) {
      console.error('Error reading database file, using seed data:', err);
      this.data = JSON.parse(JSON.stringify(SEED_DATA));
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // System status
  getSystemStatus() {
    return this.data.system;
  }

  updateSystemStatus(patch) {
    this.data.system = { ...this.data.system, ...patch, lastHeartbeat: new Date().toISOString() };
    this.save();
    return this.data.system;
  }

  // Patients
  getPatients() {
    return this.data.patients;
  }

  getPatient(id) {
    return this.data.patients.find(p => p.id === id) || this.data.patients[0];
  }

  // Medicines
  getMedicines() {
    return this.data.medicines;
  }

  addMedicine(med) {
    const newMed = { id: `med-${Date.now()}`, ...med };
    this.data.medicines.push(newMed);
    this.save();
    return newMed;
  }

  // Slots
  getSlots() {
    return this.data.slots;
  }

  getSlot(slotId) {
    return this.data.slots.find(s => s.slotId === Number(slotId));
  }

  updateSlot(slotId, patch) {
    const idx = this.data.slots.findIndex(s => s.slotId === Number(slotId));
    if (idx !== -1) {
      this.data.slots[idx] = { ...this.data.slots[idx], ...patch };
      this.save();
      return this.data.slots[idx];
    }
    return null;
  }

  // Schedules
  getSchedules() {
    return this.data.schedules;
  }

  addSchedule(sch) {
    const newSch = {
      id: `sch-${Date.now()}`,
      isActive: true,
      doseCount: 1,
      days: [0, 1, 2, 3, 4, 5, 6],
      soundPreset: 'gentle_chime',
      ...sch,
    };
    this.data.schedules.push(newSch);
    this.save();
    return newSch;
  }

  deleteSchedule(id) {
    this.data.schedules = this.data.schedules.filter(s => s.id !== id);
    this.save();
    return true;
  }

  // Dose Logs
  getDoseLogs() {
    return this.data.doseLogs;
  }

  addDoseLog(log) {
    const newLog = {
      id: `log-${Date.now()}`,
      triggeredAt: new Date().toISOString(),
      ...log,
    };
    this.data.doseLogs.unshift(newLog); // latest first
    this.save();
    return newLog;
  }

  updateDoseLog(id, patch) {
    const idx = this.data.doseLogs.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.doseLogs[idx] = { ...this.data.doseLogs[idx], ...patch };
      this.save();
      return this.data.doseLogs[idx];
    }
    return null;
  }

  // Alerts
  getAlerts() {
    return this.data.alerts;
  }

  addAlert(alert) {
    const newAlert = {
      id: `alt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false,
      ...alert,
    };
    this.data.alerts.unshift(newAlert);
    this.save();
    return newAlert;
  }

  resolveAlert(id) {
    const alert = this.data.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      this.save();
    }
    return alert;
  }

  // AI Compliance Reports
  getAiReports() {
    return this.data.aiReports;
  }

  addAiReport(report) {
    const newReport = {
      id: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      ...report,
    };
    this.data.aiReports.unshift(newReport);
    this.save();
    return newReport;
  }
}

export const db = new Database();
