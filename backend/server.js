import http from 'http';
import net from 'net';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import Aedes from 'aedes';
import { db } from './database.js';
import { SchedulerService } from './services/scheduler.js';
import { createApiRouter } from './routes/api.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const MQTT_PORT = process.env.MQTT_PORT || 1883;

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const server = http.createServer(app);

// ─── 1. Embedded MQTT Broker (Aedes) ──────────────────────────────────────────
const aedes = new Aedes();
const mqttServer = net.createServer(aedes.handle);

mqttServer.listen(MQTT_PORT, () => {
  console.log(`🔌 Embedded MQTT Broker listening on TCP port ${MQTT_PORT} (for ESP32 and IoT clients)`);
});

mqttServer.on('error', (err) => {
  console.warn(`MQTT Server Notice: Port ${MQTT_PORT} error (${err.code || err.message}). Fallback to HTTP/WS gateway enabled.`);
});

// Aedes event logging
aedes.on('client', (client) => {
  console.log(`📡 MQTT Client Connected: ${client?.id}`);
  db.updateSystemStatus({ status: 'online' });
});

aedes.on('clientDisconnect', (client) => {
  console.log(`📡 MQTT Client Disconnected: ${client?.id}`);
});

// ─── 2. WebSocket Server for Real-Time Dashboards ─────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Set();

function broadcastWs(data) {
  const message = JSON.stringify(data);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`💻 Web Dashboard Client connected to WebSocket. Total active clients: ${wsClients.size}`);

  // Send initial state dump
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    payload: {
      system: db.getSystemStatus(),
      slots: db.getSlots(),
      schedules: db.getSchedules(),
      activeTimeouts: scheduler.getActiveTimeouts(),
      alerts: db.getAlerts().slice(0, 5),
    },
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`💻 Web Dashboard Client disconnected. Remaining: ${wsClients.size}`);
  });
});

// ─── 3. MQTT Publisher Adapter & Scheduler ───────────────────────────────────
const mqttPublisher = {
  publish: (topic, payload) => {
    // 1. Publish to real Aedes MQTT clients (ESP32)
    aedes.publish(
      {
        cmd: 'publish',
        qos: 1,
        topic,
        payload,
        retain: false,
        dup: false,
      },
      () => {}
    );

    // 2. Also broadcast MQTT packet to Web Dashboards & Smart Box Twin simulator
    let jsonContent = null;
    try {
      jsonContent = JSON.parse(payload.toString());
    } catch {
      jsonContent = payload.toString();
    }

    broadcastWs({
      type: 'MQTT_PACKET',
      payload: {
        direction: 'OUTBOUND',
        topic,
        data: jsonContent,
        timestamp: new Date().toISOString(),
      },
    });
  },
};

const scheduler = new SchedulerService({
  mqttClient: mqttPublisher,
  broadcastWs,
});
scheduler.start();

// ─── 4. MQTT Inbound Message Handling ────────────────────────────────────────
aedes.on('publish', (packet, client) => {
  if (!packet?.topic || packet.topic.startsWith('$SYS')) return;

  // Broadcast inbound packet to web twin
  let payloadStr = packet.payload ? packet.payload.toString() : '';
  let payloadJson = null;
  try {
    payloadJson = JSON.parse(payloadStr);
  } catch {
    payloadJson = payloadStr;
  }

  broadcastWs({
    type: 'MQTT_PACKET',
    payload: {
      direction: 'INBOUND',
      client: client?.id || 'simulator',
      topic: packet.topic,
      data: payloadJson,
      timestamp: new Date().toISOString(),
    },
  });

  // Handle specific topics (only handle inbound /dispense, not outbound /dispensed)
  if (packet.topic.endsWith('/dispense') && !packet.topic.endsWith('/dispensed')) {
    const slotId = payloadJson?.slotId;
    if (slotId) {
      console.log(`📥 MQTT dispense event received for Slot ${slotId}`);
      scheduler.handleDispense(slotId);
    }
  } else if (packet.topic.includes('/telemetry')) {
    if (payloadJson) {
      db.updateSystemStatus({
        temperatureC: payloadJson.temperatureC,
        humidityPct: payloadJson.humidityPct,
        batteryPct: payloadJson.batteryPct,
      });
      broadcastWs({
        type: 'SYSTEM_UPDATED',
        payload: db.getSystemStatus(),
      });
    }
  }
});

// ─── 5. API Routes ────────────────────────────────────────────────────────────
app.use('/api', createApiRouter(scheduler, mqttPublisher));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Smart MediBox Backend</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h1 { color: #38bdf8; font-size: 24px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .badge { display: inline-block; background: #065f46; color: #34d399; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
          .btn { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; transition: 0.2s; }
          .btn:hover { background: #0369a1; }
          ul { list-style: none; padding: 0; margin: 20px 0; text-align: left; background: #0f172a; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 13px; }
          li { padding: 6px 0; color: #cbd5e1; border-bottom: 1px solid #1e293b; }
          li:last-child { border: none; }
          a.link { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● Backend & MQTT Online</div>
          <h1>🚀 Smart MediBox Cloud Backend</h1>
          <p>The IoT Gateway, MQTT Broker, and Gemini AI pipeline are operational.</p>
          
          <ul>
            <li>📱 <strong>Mobile App:</strong> <a class="link" href="http://localhost:5173" target="_blank">http://localhost:5173</a></li>
            <li>🔌 <strong>MQTT Broker:</strong> <code>mqtt://localhost:1883</code></li>
            <li>🩺 <strong>REST API:</strong> <a class="link" href="/api/system" target="_blank">/api/system</a></li>
            <li>❤️ <strong>Health Check:</strong> <a class="link" href="/health" target="_blank">/health</a></li>
          </ul>

          <a href="http://localhost:5173" class="btn">Open Smart MediBox Mobile App ➔</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeTimeouts: scheduler.getActiveTimeouts().length,
  });
});

// ─── 6. Launch Server ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
🚀 =================================================================
   Smart MediBox Cloud Backend & IoT Gateway Running!
   • HTTP / REST API:  http://localhost:${PORT}/api
   • WebSockets:       ws://localhost:${PORT}/ws
   • MQTT Broker:      mqtt://localhost:${MQTT_PORT}
   • Health Check:     http://localhost:${PORT}/health
=================================================================
  `);
});
