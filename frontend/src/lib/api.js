import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:5001/api';
const WS_URL = 'ws://localhost:5001/ws';

// ─── REST API Client ──────────────────────────────────────────────────────────
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const json = await res.json();
      errorDetail = json.error || json.message || errorDetail;
    } catch {}
    throw new Error(errorDetail || `API request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // System
  getSystem: () => apiRequest('/system'),
  updateTelemetry: (data) => apiRequest('/system/telemetry', { method: 'POST', body: JSON.stringify(data) }),

  // Patients & Medicines
  getPatients: () => apiRequest('/patients'),
  getMedicines: () => apiRequest('/medicines'),
  addMedicine: (data) => apiRequest('/medicines', { method: 'POST', body: JSON.stringify(data) }),

  // Slots (Phase 2)
  getSlots: () => apiRequest('/slots'),
  updateSlot: (slotId, data) => apiRequest(`/slots/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  refillSlot: (slotId, count) => apiRequest(`/slots/${slotId}/refill`, { method: 'POST', body: JSON.stringify({ count }) }),

  // Schedules (Phase 2)
  getSchedules: () => apiRequest('/schedules'),
  addSchedule: (data) => apiRequest('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  deleteSchedule: (id) => apiRequest(`/schedules/${id}`, { method: 'DELETE' }),
  syncToBox: () => apiRequest('/schedules/sync-to-box', { method: 'POST' }),

  // Logs & Alerts
  getLogs: () => apiRequest('/logs'),
  getAlerts: () => apiRequest('/alerts'),
  resolveAlert: (id) => apiRequest(`/alerts/${id}/resolve`, { method: 'PUT' }),

  // AI Workflows (Phase 1 & Phase 6)
  parsePrescription: (data) => apiRequest('/prescriptions/parse', { method: 'POST', body: JSON.stringify(data) }),
  generateComplianceReport: () => apiRequest('/analytics/generate', { method: 'POST' }),
  getComplianceReports: () => apiRequest('/analytics/reports'),

  // Hardware Simulation / Live Edge (Phase 3, 4, 5)
  triggerDose: (data) => apiRequest('/iot/trigger', { method: 'POST', body: JSON.stringify(data) }),
  tapTouch: (slotId) => apiRequest('/iot/touch', { method: 'POST', body: JSON.stringify({ slotId }) }),
  dispense: (slotId) => apiRequest('/iot/dispense', { method: 'POST', body: JSON.stringify({ slotId }) }),
  fastForwardTimeout: (slotId) => apiRequest('/iot/fast-forward-timeout', { method: 'POST', body: JSON.stringify({ slotId }) }),
};

// ─── Real-Time WebSocket Hook ────────────────────────────────────────────────
export function useMediBoxSocket(onMessageCallback) {
  const [connected, setConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState(null);
  const wsRef = useRef(null);
  const callbackRef = useRef(onMessageCallback);
  callbackRef.current = onMessageCallback;

  useEffect(() => {
    let reconnectTimer = null;
    let isMounted = true;

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('✅ Connected to MediBox WebSocket gateway');
          setConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setLatestEvent(data);
            if (callbackRef.current) {
              callbackRef.current(data);
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          // Auto reconnect after 2 seconds
          reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { connected, latestEvent };
}
