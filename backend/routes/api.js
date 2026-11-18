import express from 'express';
import { db } from '../database.js';
import { parsePrescription, generateComplianceAnalytics } from '../services/aiService.js';

export function createApiRouter(scheduler, mqttClient) {
  const router = express.Router();

  // ─── System & Telemetry ─────────────────────────────────────────────
  router.get('/system', (req, res) => {
    res.json({
      success: true,
      system: db.getSystemStatus(),
      activeTimeouts: scheduler.getActiveTimeouts(),
    });
  });

  router.post('/system/telemetry', (req, res) => {
    const { temperatureC, humidityPct, batteryPct } = req.body;
    const updated = db.updateSystemStatus({
      ...(temperatureC !== undefined && { temperatureC: Number(temperatureC) }),
      ...(humidityPct !== undefined && { humidityPct: Number(humidityPct) }),
      ...(batteryPct !== undefined && { batteryPct: Number(batteryPct) }),
    });

    // Check high temp warning
    if (temperatureC && temperatureC > 27) {
      db.addAlert({
        type: 'temp_warning',
        severity: 'warning',
        recipient: 'Caretaker',
        title: 'High Box Temperature Detected',
        message: `Internal box temperature reached ${temperatureC}°C. Move box away from direct sunlight to preserve medication potency.`,
      });
    }

    res.json({ success: true, system: updated });
  });

  // ─── Patients ───────────────────────────────────────────────────────
  router.get('/patients', (req, res) => {
    res.json({ success: true, patients: db.getPatients() });
  });

  // ─── Medicines ──────────────────────────────────────────────────────
  router.get('/medicines', (req, res) => {
    res.json({ success: true, medicines: db.getMedicines() });
  });

  router.post('/medicines', (req, res) => {
    const newMed = db.addMedicine(req.body);
    res.json({ success: true, medicine: newMed });
  });

  // ─── Slots (Phase 2: Slot Management & Mapping) ────────────────────
  router.get('/slots', (req, res) => {
    res.json({ success: true, slots: db.getSlots() });
  });

  router.put('/slots/:slotId', (req, res) => {
    const slotId = Number(req.params.slotId);
    const updated = db.updateSlot(slotId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }
    res.json({ success: true, slot: updated });
  });

  router.post('/slots/:slotId/refill', (req, res) => {
    const slotId = Number(req.params.slotId);
    const slot = db.getSlot(slotId);
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

    const newCount = req.body.count || slot.pillCapacity || 30;
    const updated = db.updateSlot(slotId, {
      currentCount: newCount,
      status: 'ready',
    });

    db.addAlert({
      type: 'refill_success',
      severity: 'info',
      recipient: 'Caretaker',
      title: `Slot ${slotId} Refilled`,
      message: `${slot.medicineName} refilled to ${newCount} pills. Low stock alert cleared.`,
      slotId,
    });

    res.json({ success: true, slot: updated });
  });

  // ─── Schedules (Phase 2: Human-in-the-Loop Sync via MQTT) ─────────
  router.get('/schedules', (req, res) => {
    res.json({ success: true, schedules: db.getSchedules() });
  });

  router.post('/schedules', (req, res) => {
    const newSch = db.addSchedule(req.body);
    res.json({ success: true, schedule: newSch });
  });

  router.delete('/schedules/:id', (req, res) => {
    db.deleteSchedule(req.params.id);
    res.json({ success: true });
  });

  // Human-in-the-Loop Confirmation & MQTT Sync
  router.post('/schedules/sync-to-box', (req, res) => {
    const boxId = db.getSystemStatus().boxId;
    const schedules = db.getSchedules();
    const slots = db.getSlots();

    const syncPayload = {
      event: 'SCHEDULE_SYNC',
      boxId,
      syncedAt: new Date().toISOString(),
      schedules,
      slots: slots.map(s => ({
        slotId: s.slotId,
        medicineName: s.medicineName,
        pillCount: s.currentCount,
        ledColor: s.ledColor,
      })),
    };

    if (mqttClient) {
      mqttClient.publish(
        `medibox/${boxId}/schedule`,
        Buffer.from(JSON.stringify(syncPayload))
      );
      console.log(`📡 [MQTT Sync Published] Topic: medibox/${boxId}/schedule`);
    }

    res.json({
      success: true,
      message: 'Schedule and slot mapping successfully verified and synced to Smart Box via MQTT!',
      boxId,
      itemCount: schedules.length,
    });
  });

  // ─── Dose Logs & History ───────────────────────────────────────────
  router.get('/logs', (req, res) => {
    res.json({ success: true, logs: db.getDoseLogs() });
  });

  // ─── Alerts & Notifications ────────────────────────────────────────
  router.get('/alerts', (req, res) => {
    res.json({ success: true, alerts: db.getAlerts() });
  });

  router.put('/alerts/:id/resolve', (req, res) => {
    const resolved = db.resolveAlert(req.params.id);
    res.json({ success: true, alert: resolved });
  });

  // ─── Phase 1: AI Prescription Parsing ──────────────────────────────
  router.post('/prescriptions/parse', async (req, res) => {
    try {
      const { imageBase64, mimeType, prescriptionText } = req.body;
      const parsedResult = await parsePrescription({ imageBase64, mimeType, prescriptionText });
      res.json({ success: true, data: parsedResult });
    } catch (err) {
      console.error('Error in /prescriptions/parse:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── Phase 6: AI Compliance Analytics ──────────────────────────────
  router.post('/analytics/generate', async (req, res) => {
    try {
      const patient = db.getPatients()[0];
      const doseLogs = db.getDoseLogs();
      const slots = db.getSlots();
      const system = db.getSystemStatus();

      const report = await generateComplianceAnalytics({
        patient,
        doseLogs,
        slots,
        currentTemp: system.temperatureC,
        currentHumidity: system.humidityPct,
      });

      const savedReport = db.addAiReport(report);
      res.json({ success: true, report: savedReport });
    } catch (err) {
      console.error('Error in /analytics/generate:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/analytics/reports', (req, res) => {
    res.json({ success: true, reports: db.getAiReports() });
  });

  // ─── Phase 3, 4, 5: Hardware Triggers & IoT Simulation ─────────────
  // Trigger dose reminder
  router.post('/iot/trigger', (req, res) => {
    const { slotId = 1, customGraceSec = 300, soundPreset = 'voice_prompt' } = req.body;
    const timeoutData = scheduler.triggerDose({
      slotId: Number(slotId),
      soundPreset,
      customGraceSec: Number(customGraceSec),
    });

    if (!timeoutData) {
      return res.status(400).json({ success: false, error: 'Could not trigger dose for slot ' + slotId });
    }

    res.json({ success: true, timeout: timeoutData });
  });

  // Phase 4: Touch sensor tap to unlock
  router.post('/iot/touch', (req, res) => {
    const { slotId } = req.body;
    const slotNum = Number(slotId);
    const slot = db.getSlot(slotNum);
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

    db.updateSlot(slotNum, { isUnlocked: true });

    const boxId = db.getSystemStatus().boxId;
    if (mqttClient) {
      mqttClient.publish(
        `medibox/${boxId}/touch`,
        Buffer.from(JSON.stringify({
          event: 'TOUCH_DETECTED',
          boxId,
          slotId: slotNum,
          timestamp: new Date().toISOString(),
        }))
      );
    }

    res.json({ success: true, message: `Slot ${slotNum} unlocked by touch sensor. Opening lid enabled.` });
  });

  // Phase 4: Hall effect sensor detects lid open -> pill taken
  router.post('/iot/dispense', (req, res) => {
    const { slotId } = req.body;
    const result = scheduler.handleDispense(slotId);
    if (!result) {
      return res.status(400).json({ success: false, error: 'Could not record dispense for slot ' + slotId });
    }
    res.json({ success: true, result });
  });

  // Phase 5: Fast-forward timeout to simulate missed dose protocol
  router.post('/iot/fast-forward-timeout', (req, res) => {
    const { slotId } = req.body;
    const expired = scheduler.forceExpire(slotId);
    res.json({ success: expired, message: expired ? `Slot ${slotId} timeout expired. Missed dose alert triggered.` : 'No active timeout found for slot' });
  });

  return router;
}
