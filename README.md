# Smart MediBox — IoT Medication Adherence & Compliance Engine

A closed-loop smart pill dispenser ecosystem pairing an **ESP32 microcontroller** with a **Node.js backend** (embedded Aedes MQTT broker & WebSockets) and a **Capacitor / React** cross-platform mobile application, powered by **Google Gemini 2.5 Flash AI**.

---

## 🌟 Key Features

1. **Phase 1 — Multimodal AI Prescription Parsing:** Extract medicine names, dosages, frequencies, and suggested schedules directly from prescription photos or text using Gemini 2.5 Flash Vision.
2. **Phase 2 — Human-in-the-Loop Slot Mapping & MQTT Sync:** Verify extracted medications and map them to 6 physical compartments; sync schedules over MQTT to the hardware.
3. **Phase 3 — Audio-Visual Hardware Alerts:** Trigger NeoPixel LEDs, I2C OLED screen instructions, buzzer chimes, and browser voice guidance upon scheduled dose times.
4. **Phase 4 — 2-Factor Physical Dispensing Verification:** Enforce dual-sensor physical verification (capacitive touch to unlock + magnetic Hall-effect sensor to confirm lid opening) before decrementing pill counts.
5. **Phase 5 — Asynchronous Timeout & Safety Escalation:** 5-minute active grace period state machine; automatically flags missed doses and dispatches urgent alerts to family contacts and primary physicians.
6. **Phase 6 — AI Compliance Analytics:** Generates clinical adherence reports, behavioral trend patterns, and physician recommendations based on intake delays and environmental telemetry (DHT temperature/humidity).

---

## 🏗️ Architecture

```
[Mobile App (React / Capacitor)] <--- WebSocket / REST ---> [Node.js Gateway Server]
                                                                  |
                                                                  |-- In-process Aedes MQTT (1883)
                                                                  |-- Gemini 2.5 Flash REST API
                                                                  |
                                                            [ESP32 Hardware]
                                                            (OLED, LEDs, Touch, Hall Sensor)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm install
node server.js
```
- REST API & WebSockets run on: `http://localhost:5001`
- MQTT Broker runs on: `mqtt://localhost:1883`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

### 4. ESP32 Firmware
- Open `firmware/smart_medibox_esp32.ino` in Arduino IDE or PlatformIO.
- Configure WiFi SSID/Password and MQTT Broker IP.
- Flash to your ESP32 board.

---

## 📱 Mobile App (Android)
```bash
cd frontend
npm run mobile:sync     # Build and sync to Capacitor
npm run mobile:android  # Launch Android Studio
```
