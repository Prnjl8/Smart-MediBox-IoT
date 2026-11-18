import { db } from '../database.js';

export class SchedulerService {
  constructor({ mqttClient, broadcastWs }) {
    this.mqttClient = mqttClient;
    this.broadcastWs = broadcastWs;
    this.activeTimeouts = new Map(); // key: slotId -> timeout info
    this.timerInterval = null;
    this.schedulerCheckInterval = null;
    this.defaultGracePeriodSec = 300; // 5 minutes
  }

  start() {
    console.log('🕒 Scheduler Service started. Monitoring schedules and timeout protocol...');
    
    // Check every second for countdown and timeout expiration
    this.timerInterval = setInterval(() => {
      this.tickTimeouts();
    }, 1000);

    // Check every 15 seconds against current wall-clock time
    this.schedulerCheckInterval = setInterval(() => {
      this.checkScheduledDoses();
    }, 15000);
  }

  stop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.schedulerCheckInterval) clearInterval(this.schedulerCheckInterval);
  }

  /**
   * Compare current time (HH:MM) to schedules
   */
  checkScheduledDoses() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const currentDay = now.getDay(); // 0 is Sunday

    const schedules = db.getSchedules();
    for (const sch of schedules) {
      if (!sch.isActive) continue;
      if (!sch.days.includes(currentDay)) continue;

      if (sch.time24 === currentTimeStr) {
        // Trigger dose if not already alerting
        if (!this.activeTimeouts.has(sch.slotId)) {
          console.log(`⏰ Scheduled time hit for Slot ${sch.slotId} (${sch.medicineName}) at ${currentTimeStr}`);
          this.triggerDose({
            slotId: sch.slotId,
            scheduleId: sch.id,
            medicineName: sch.medicineName,
            doseCount: sch.doseCount || 1,
            soundPreset: sch.soundPreset || 'voice_prompt',
          });
        }
      }
    }
  }

  /**
   * Phase 3: Hardware Trigger
   * Pushes MQTT event to smart box, illuminates slot LED, sounds alarm, displays OLED text
   */
  triggerDose({ slotId, scheduleId = null, medicineName, doseCount = 1, soundPreset = 'voice_prompt', customGraceSec = null }) {
    const slot = db.getSlot(slotId);
    if (!slot) {
      console.warn(`Cannot trigger dose: Slot ${slotId} not found`);
      return null;
    }

    const patient = db.getPatients()[0];
    const medName = medicineName || slot.medicineName;
    const gracePeriodSec = customGraceSec || this.defaultGracePeriodSec;

    // 1. Create pending dose log
    const logEntry = db.addDoseLog({
      scheduleId,
      slotId: Number(slotId),
      patientId: patient?.id || 'p-1',
      medicineName: medName,
      date: new Date().toISOString().split('T')[0],
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triggeredAt: new Date().toISOString(),
      dispensedAt: null,
      status: 'pending',
      delayMinutes: 0,
      weightDeltaGrams: 0,
      pillVerificationScore: 0,
    });

    // 2. Update slot status in DB
    db.updateSlot(slotId, {
      status: 'alerting',
      isUnlocked: false,
      isLidOpen: false,
    });

    // 3. Register asynchronous timeout tracker (Phase 5)
    const timeoutData = {
      slotId: Number(slotId),
      logId: logEntry.id,
      medicineName: medName,
      doseCount,
      ledColor: slot.ledColor || '#10b981',
      soundPreset,
      totalGraceSec: gracePeriodSec,
      remainingSec: gracePeriodSec,
      triggeredAt: Date.now(),
      patientName: patient?.name || 'Patient',
    };
    this.activeTimeouts.set(Number(slotId), timeoutData);

    // 4. Publish MQTT Hardware Trigger Event
    const boxId = db.getSystemStatus().boxId;
    const mqttPayload = {
      event: 'DOSE_TRIGGER',
      boxId,
      slotId: Number(slotId),
      medicineName: medName,
      dosage: slot.dosage || '',
      doseCount,
      ledColor: slot.ledColor || '#10b981',
      soundPreset,
      oledMessage: `SLOT ${slotId}: ${medName.toUpperCase()}\nTAKE ${doseCount} PILL(S)`,
      timestamp: new Date().toISOString(),
    };

    if (this.mqttClient) {
      this.mqttClient.publish(
        `medibox/${boxId}/trigger`,
        Buffer.from(JSON.stringify(mqttPayload))
      );
      console.log(`📡 [MQTT Published] Topic: medibox/${boxId}/trigger`, mqttPayload);
    }

    // 5. Broadcast to WebSocket frontend
    this.broadcastWs({
      type: 'DOSE_TRIGGERED',
      payload: timeoutData,
    });

    return timeoutData;
  }

  /**
   * Phase 4: Physical Dispensing & Inventory Tracking
   * Called when patient taps touch sensor & Hall effect sensor detects lid open
   */
  handleDispense(slotId) {
    const slotNum = Number(slotId);
    const timeout = this.activeTimeouts.get(slotNum);

    const slot = db.getSlot(slotNum);
    if (!slot) return null;

    // Deduct pills from inventory
    const doseCount = timeout?.doseCount || 1;
    const newCount = Math.max(0, slot.currentCount - doseCount);
    const isLowStock = newCount <= slot.refillThreshold;

    db.updateSlot(slotNum, {
      currentCount: newCount,
      isLidOpen: true,
      isUnlocked: true,
      status: isLowStock ? 'low_stock' : 'ready',
      lastDispensedAt: new Date().toISOString(),
    });

    // Update log
    let updatedLog = null;
    if (timeout?.logId) {
      const delayMins = Math.round((Date.now() - timeout.triggeredAt) / 60000);
      updatedLog = db.updateDoseLog(timeout.logId, {
        status: 'taken',
        dispensedAt: new Date().toISOString(),
        delayMinutes: delayMins,
        weightDeltaGrams: (0.45 * doseCount).toFixed(2),
        pillVerificationScore: 0.98,
      });
    }

    // Cancel Asynchronous Timeout Protocol
    this.activeTimeouts.delete(slotNum);

    // Check inventory refill warning
    let refillAlert = null;
    if (isLowStock) {
      refillAlert = db.addAlert({
        type: 'refill_warning',
        severity: 'warning',
        recipient: 'Pharmacy & Caretaker',
        title: `Low Supply Alert: Slot ${slotNum} (${slot.medicineName})`,
        message: `${slot.medicineName} only has ${newCount} dose(s) left. Automatic refill draft initiated.`,
        slotId: slotNum,
      });
      console.log(`⚠️ Refill Warning Alert generated for Slot ${slotNum}: ${newCount} pills remaining`);
    }

    // Publish MQTT event
    const boxId = db.getSystemStatus().boxId;
    if (this.mqttClient) {
      this.mqttClient.publish(
        `medibox/${boxId}/dispensed`,
        Buffer.from(JSON.stringify({
          event: 'DOSE_TAKEN',
          boxId,
          slotId: slotNum,
          medicineName: slot.medicineName,
          remainingCount: newCount,
          timestamp: new Date().toISOString(),
        }))
      );
    }

    // Broadcast WebSocket
    this.broadcastWs({
      type: 'DOSE_DISPENSED',
      payload: {
        slotId: slotNum,
        remainingCount: newCount,
        isLowStock,
        log: updatedLog,
        alert: refillAlert,
      },
    });

    // Auto close lid state after 3 seconds for realism
    setTimeout(() => {
      db.updateSlot(slotNum, { isLidOpen: false, isUnlocked: false });
      this.broadcastWs({
        type: 'SLOT_UPDATED',
        payload: db.getSlot(slotNum),
      });
    }, 3000);

    return { slot: db.getSlot(slotNum), log: updatedLog };
  }

  /**
   * Phase 5: Asynchronous Timeout Protocol tick
   * Decrements remaining grace period. If 0, marks Missed Dose and alerts Doctor & Family
   */
  tickTimeouts() {
    for (const [slotId, timeout] of this.activeTimeouts.entries()) {
      timeout.remainingSec -= 1;

      // Broadcast countdown tick every second
      this.broadcastWs({
        type: 'TIMEOUT_TICK',
        payload: {
          slotId,
          remainingSec: timeout.remainingSec,
          totalGraceSec: timeout.totalGraceSec,
        },
      });

      if (timeout.remainingSec <= 0) {
        this.handleTimeoutExpired(slotId, timeout);
      }
    }
  }

  /**
   * Handles timeout expiration
   */
  handleTimeoutExpired(slotId, timeout) {
    console.log(`🚨 Asynchronous Grace Period Expired for Slot ${slotId} (${timeout.medicineName})! Triggering Missed Dose Protocol.`);
    
    // Remove from active map
    this.activeTimeouts.delete(slotId);

    // 1. Update DB slot status to ready
    db.updateSlot(slotId, {
      status: 'ready',
      isUnlocked: false,
      isLidOpen: false,
    });

    // 2. Mark log as missed
    let missedLog = null;
    if (timeout.logId) {
      missedLog = db.updateDoseLog(timeout.logId, {
        status: 'missed',
        dispensedAt: null,
        delayMinutes: Math.round(timeout.totalGraceSec / 60),
        reason: 'Grace period expired without lid open',
      });
    }

    // 3. Deactivate hardware box alerts via MQTT
    const boxId = db.getSystemStatus().boxId;
    if (this.mqttClient) {
      this.mqttClient.publish(
        `medibox/${boxId}/deactivate`,
        Buffer.from(JSON.stringify({
          event: 'TIMEOUT_DEACTIVATE',
          boxId,
          slotId,
          timestamp: new Date().toISOString(),
        }))
      );
      console.log(`📡 [MQTT Published] Topic: medibox/${boxId}/deactivate`);
    }

    // 4. Push Immediate Notification to Family Member and Doctor
    const patient = db.getPatients()[0];
    const emergencyAlert = db.addAlert({
      type: 'missed_dose',
      severity: 'emergency',
      recipient: `${patient.primaryDoctor} & ${patient.familyContactName}`,
      title: `URGENT: Missed Dose - ${timeout.medicineName} (Slot ${slotId})`,
      message: `${patient.name} did not open Slot ${slotId} for ${timeout.medicineName} within the ${Math.round(timeout.totalGraceSec / 60)}-minute grace period. Immediate follow-up recommended.`,
      slotId,
    });

    // 5. Broadcast to Dashboards
    this.broadcastWs({
      type: 'DOSE_MISSED',
      payload: {
        slotId,
        timeout,
        log: missedLog,
        alert: emergencyAlert,
      },
    });
  }

  /**
   * Fast-Forward or force-expire timeout for demo/testing
   */
  forceExpire(slotId) {
    const slotNum = Number(slotId);
    const timeout = this.activeTimeouts.get(slotNum);
    if (timeout) {
      this.handleTimeoutExpired(slotNum, timeout);
      return true;
    }
    return false;
  }

  getActiveTimeouts() {
    return Array.from(this.activeTimeouts.values());
  }
}
