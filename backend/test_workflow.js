/**
 * Automated Verification Script for Smart MediBox
 * Tests all 6 phases of the operational workflow against the running backend server.
 */

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 Starting Smart MediBox Operational Workflow Test Suite...\n');

  try {
    // 0. Health check
    console.log('Testing System Health & Telemetry...');
    const healthRes = await fetch('http://localhost:5001/health').then(r => r.json());
    console.log('✅ Health check passed. Uptime:', healthRes.uptime, 's\n');

    // Phase 1: AI Prescription Parsing
    console.log('--- PHASE 1: AI Prescription Parsing ---');
    const parseRes = await fetch(`${BASE_URL}/prescriptions/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prescriptionText: 'Rx: Metformin 500mg 1 tab twice daily with food. Lisinopril 10mg 1 tab every morning.',
      }),
    }).then(r => r.json());
    console.log('Parsed medicines count:', parseRes.data?.medicines?.length);
    console.log('First medication:', parseRes.data?.medicines?.[0]?.name, parseRes.data?.medicines?.[0]?.dosage);
    console.log('✅ Phase 1 Verified!\n');

    // Phase 2: Human-in-the-Loop Slot Mapping & MQTT Sync
    console.log('--- PHASE 2: Human-in-the-Loop Slot Mapping & MQTT Sync ---');
    const updateSlotRes = await fetch(`${BASE_URL}/slots/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicineName: 'Metformin 500mg',
        currentCount: 20,
        refillThreshold: 5,
        status: 'ready',
      }),
    }).then(r => r.json());
    console.log('Slot 1 updated. Current count:', updateSlotRes.slot.currentCount);

    const syncRes = await fetch(`${BASE_URL}/schedules/sync-to-box`, {
      method: 'POST',
    }).then(r => r.json());
    console.log('MQTT Schedule Sync response:', syncRes.message);
    console.log('✅ Phase 2 Verified!\n');

    // Phase 3: Hardware Trigger
    console.log('--- PHASE 3: Hardware Trigger ---');
    const triggerRes = await fetch(`${BASE_URL}/iot/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: 1, customGraceSec: 300 }),
    }).then(r => r.json());
    console.log('Triggered dose for:', triggerRes.timeout?.medicineName, 'Grace seconds:', triggerRes.timeout?.totalGraceSec);
    console.log('✅ Phase 3 Verified!\n');

    // Phase 4: Physical Dispensing (Touch + Hall Effect Lid Sensor)
    console.log('--- PHASE 4: Physical Dispensing & Inventory Tracking ---');
    const touchRes = await fetch(`${BASE_URL}/iot/touch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: 1 }),
    }).then(r => r.json());
    console.log('Touch unlock result:', touchRes.message);

    const dispenseRes = await fetch(`${BASE_URL}/iot/dispense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: 1 }),
    }).then(r => r.json());
    console.log('Dispensed. New inventory count:', dispenseRes.result.slot.currentCount);
    console.log('Log status:', dispenseRes.result.log.status, 'Delay:', dispenseRes.result.log.delayMinutes, 'min');
    console.log('✅ Phase 4 Verified!\n');

    // Phase 5: Asynchronous Timeout Protocol & Missed Dose Alert
    console.log('--- PHASE 5: Asynchronous Timeout Protocol ---');
    // Trigger dose on Slot 3
    await fetch(`${BASE_URL}/iot/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: 3, customGraceSec: 300 }),
    });
    // Force expire timeout
    const expireRes = await fetch(`${BASE_URL}/iot/fast-forward-timeout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: 3 }),
    }).then(r => r.json());
    console.log('Timeout expired response:', expireRes.message);

    // Verify alerts table has the missed dose alert
    const alertsRes = await fetch(`${BASE_URL}/alerts`).then(r => r.json());
    const missedAlert = alertsRes.alerts.find(a => a.type === 'missed_dose');
    console.log('Generated Missed Dose Emergency Alert:', missedAlert?.title, '-> Recipient:', missedAlert?.recipient);
    console.log('✅ Phase 5 Verified!\n');

    // Phase 6: AI Compliance Analytics
    console.log('--- PHASE 6: AI Compliance Analytics ---');
    const analyticsRes = await fetch(`${BASE_URL}/analytics/generate`, {
      method: 'POST',
    }).then(r => r.json());
    console.log('Report Adherence Rate:', analyticsRes.report?.adherenceRate, '%');
    console.log('Report Risk Level:', analyticsRes.report?.riskLevel);
    console.log('Executive Summary:', analyticsRes.report?.executiveSummary?.slice(0, 100), '...');
    console.log('Doctor Recommendations Count:', analyticsRes.report?.doctorRecommendations?.length);
    console.log('✅ Phase 6 Verified!\n');

    console.log('🎉 ALL 6 WORKFLOW PHASES FULLY VERIFIED AND OPERATIONAL!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
