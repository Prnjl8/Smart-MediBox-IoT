# 🛠️ Smart MediBox - ESP32 Hardware Wiring & Flashing Guide

This document describes the circuit pinouts, hardware connections, and instructions to build and flash the physical Smart Medicine Box.

---

## 1. Bill of Materials (BOM)

| Component | Purpose | Recommended Model / Spec |
| :--- | :--- | :--- |
| **Microcontroller** | Main Controller & Wi-Fi/MQTT Edge Node | ESP32-WROOM-32D / ESP32-CAM |
| **Display** | 0.96" OLED Screen for active dose instructions | SSD1306 (I2C, 128x64) |
| **LED Indicators** | Visual compartment lighting & pulsing | Adafruit NeoPixel WS2812B RGB Strip (6 LEDs) |
| **Touch Sensors** | Physical capacitive touch unlock per slot | 6x TTP223 Digital Capacitive Touch Sensors |
| **Lid Sensors** | Physical lid opening / intake confirmation | 6x A3144 Hall Effect Magnetic Sensors + Neodymium Magnets |
| **Weight Verification** | Sub-gram pill removal measurement | HX711 24-bit ADC + 500g Micro Load Cell |
| **Audio Buzzer / Voice** | Spoken voice prompts & acoustic chime | DFPlayer Mini (UART) or 5V Active Buzzer |
| **Environment Sensor** | Internal medicine heat/humidity safety monitoring | BME280 (I2C) |
| **Power Supply** | Portable battery power with 5V backup | TP4056 + 18650 Li-Ion Battery & 5V Step-up |

---

## 2. ESP32 GPIO Pinout Mapping

```
ESP32 Dev Module
┌───────────────────────────────────────────────┐
│ [3V3] ─── VCC (Sensors, OLED, BME280)        │
│ [GND] ─── Common Ground                      │
│                                               │
│ [GPIO 21] ─── I2C SDA (OLED + BME280)        │
│ [GPIO 22] ─── I2C SCL (OLED + BME280)        │
│                                               │
│ [GPIO 18] ─── NeoPixel DIN (Slot RGB LEDs)    │
│ [GPIO 25] ─── Buzzer (+) / Audio Alert        │
│                                               │
│ [GPIO 19] ─── HX711 DOUT (Weight Data)       │
│ [GPIO 23] ─── HX711 SCK (Weight Clock)       │
│                                               │
│ Touch Sensors (TTP223 - Unlocking):           │
│   Slot 1: GPIO 4    Slot 2: GPIO 13          │
│   Slot 3: GPIO 14   Slot 4: GPIO 27          │
│   Slot 5: GPIO 32   Slot 6: GPIO 33          │
│                                               │
│ Hall Sensors (A3144 - Lid Intake Detection):  │
│   Slot 1: GPIO 34   Slot 2: GPIO 35          │
│   Slot 3: GPIO 36   Slot 4: GPIO 39          │
│   Slot 5: GPIO 16   Slot 6: GPIO 17          │
└───────────────────────────────────────────────┘
```

---

## 3. Flashing Instructions (Arduino IDE / PlatformIO)

1. **Install Arduino ESP32 Board Support:**
   - Add URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` in Arduino Preferences.
   - Install **esp32 by Espressif Systems** via Board Manager.

2. **Install Required Libraries:**
   - `PubSubClient` by Nick O'Leary
   - `Adafruit SSD1306` & `Adafruit GFX Library`
   - `Adafruit NeoPixel`
   - `Adafruit BME280 Library`
   - `HX711 Arduino Library` by Bogdan Necula
   - `ArduinoJson` (v6 or v7) by Benoit Blanchon

3. **Configure Network:**
   - In `smart_medibox_esp32.ino`, set:
     ```cpp
     const char* WIFI_SSID   = "Your_WiFi_SSID";
     const char* WIFI_PASS   = "Your_WiFi_Password";
     const char* MQTT_SERVER = "YOUR_COMPUTER_LOCAL_IP"; // e.g. 192.168.1.50
     const int   MQTT_PORT   = 1883;
     ```

4. **Upload:**
   - Select Board: `ESP32 Dev Module`.
   - Select Port and press **Upload**.
   - Open Serial Monitor at `115200 baud` to see boot logs and live MQTT message exchange!
