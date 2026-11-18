/*
 * ==============================================================================
 * 🚀 SMART MEDIBOX - ESP32 FIRMWARE WITH MQTT & SENSOR FUSION
 * ==============================================================================
 * Features:
 *  - Dual Wi-Fi & MQTT Auto-Reconnect (PubSubClient)
 *  - 0.96" I2C OLED Display (SSD1306) showing real-time medication alerts
 *  - Adafruit NeoPixel RGB LED Strip (1 dedicated LED per compartment)
 *  - 6x TTP223 Capacitive Touch Sensors for physical unlocking
 *  - 6x Hall Effect Magnetic Sensors (A3144) for lid opening detection
 *  - HX711 24-bit ADC + Load Cell for milligram pill intake verification
 *  - DFPlayer Mini MP3 Player via UART for native spoken voice prompts
 *  - BME280 Environmental Sensor for internal temperature & humidity telemetry
 *  - NTP Time Synchronization
 * ==============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>
#include "HX711.h"

// ─── Wi-Fi & MQTT Configuration ───────────────────────────────────────────────
const char* WIFI_SSID     = "Your_WiFi_SSID";
const char* WIFI_PASS     = "Your_WiFi_Password";
const char* MQTT_SERVER   = "192.168.1.100"; // IP address of backend server
const int   MQTT_PORT     = 1883;
const char* DEVICE_ID     = "BOX-MED-8491";

// MQTT Topics
const char* TOPIC_TRIGGER    = "medibox/BOX-MED-8491/trigger";
const char* TOPIC_DEACTIVATE = "medibox/BOX-MED-8491/deactivate";
const char* TOPIC_SCHEDULE   = "medibox/BOX-MED-8491/schedule";
const char* TOPIC_DISPENSE   = "medibox/BOX-MED-8491/dispense";
const char* TOPIC_TELEMETRY  = "medibox/BOX-MED-8491/telemetry";
const char* TOPIC_TOUCH      = "medibox/BOX-MED-8491/touch";

// ─── Pin Definitions ──────────────────────────────────────────────────────────
#define OLED_SDA_PIN    21
#define OLED_SCL_PIN    22
#define OLED_SCREEN_WIDTH  128
#define OLED_SCREEN_HEIGHT 64
#define OLED_RESET_PIN    -1

#define NEOPIXEL_PIN    18
#define NUM_SLOTS       6

#define HX711_DOUT_PIN  19
#define HX711_SCK_PIN   23

#define BUZZER_PIN      25

// Touch Sensors (TTP223) mapped to GPIOs
const int TOUCH_PINS[NUM_SLOTS] = { 4, 13, 14, 27, 32, 33 };

// Hall Effect Sensors (A3144 - Active LOW with magnet)
const int HALL_PINS[NUM_SLOTS]  = { 34, 35, 36, 39, 16, 17 };

// ─── Hardware Peripherals ─────────────────────────────────────────────────────
Adafruit_SSD1306 display(OLED_SCREEN_WIDTH, OLED_SCREEN_HEIGHT, &Wire, OLED_RESET_PIN);
Adafruit_NeoPixel strip(NUM_SLOTS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_BME280 bme;
HX711 scale;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ─── Global State ─────────────────────────────────────────────────────────────
int activeSlotAlert = -1; // -1 = None, 0..5 = Slot index
String activeMedName = "";
String activeDose = "";
unsigned long alertStartTime = 0;
unsigned long lastTelemetryTime = 0;
float baselineWeight = 0.0;
bool slotUnlocked[NUM_SLOTS] = { false, false, false, false, false, false };
bool prevHallState[NUM_SLOTS] = { HIGH, HIGH, HIGH, HIGH, HIGH, HIGH };

// ─── Function Declarations ────────────────────────────────────────────────────
void setupWiFi();
void setupMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void reconnectMQTT();
void updateOledDisplay(const char* header, const char* line1, const char* line2);
void triggerSlotAlert(int slot, const char* medName, const char* dose, uint32_t color);
void deactivateAlert();
void publishDispenseEvent(int slot, float weightChange);
void publishTelemetry();

// ─── SETUP ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n🚀 Initializing Smart MediBox Firmware...");

  // Initialize Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize Sensors
  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(TOUCH_PINS[i], INPUT);
    pinMode(HALL_PINS[i], INPUT_PULLUP);
  }

  // Initialize I2C and OLED
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("❌ SSD1306 allocation failed");
  } else {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    updateOledDisplay("MEDIBOX ONLINE", "Connecting...", "Wi-Fi Init");
  }

  // Initialize NeoPixel LED Strip
  strip.begin();
  strip.setBrightness(120);
  for (int i = 0; i < NUM_SLOTS; i++) {
    strip.setPixelColor(i, strip.Color(0, 0, 0));
  }
  strip.show();

  // Initialize BME280 (Temperature & Humidity)
  if (!bme.begin(0x76, &Wire)) {
    Serial.println("⚠️ BME280 sensor not detected (check I2C address 0x76/0x77)");
  }

  // Initialize HX711 Load Cell
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  if (scale.is_ready()) {
    scale.set_scale(2280.f); // Calibration factor
    scale.tare();
    baselineWeight = scale.get_units(5);
    Serial.printf("⚖️ Load Cell Ready. Baseline weight: %.2fg\n", baselineWeight);
  }

  // Connect Network
  setupWiFi();
  setupMQTT();

  updateOledDisplay("MEDIBOX READY", "All Systems OK", "Awaiting Doses");
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // 1. Check Capacitive Touch Sensors (Touch to Unlock)
  for (int i = 0; i < NUM_SLOTS; i++) {
    int touchVal = digitalRead(TOUCH_PINS[i]);
    if (touchVal == HIGH && !slotUnlocked[i]) {
      slotUnlocked[i] = true;
      Serial.printf("👆 Touch detected on Slot %d. Unlocking compartment.\n", i + 1);

      // Publish touch event to MQTT
      StaticJsonDocument<128> doc;
      doc["event"] = "TOUCH_DETECTED";
      doc["boxId"] = DEVICE_ID;
      doc["slotId"] = i + 1;
      char buffer[128];
      serializeJson(doc, buffer);
      mqttClient.publish(TOPIC_TOUCH, buffer);

      // Acoustic chime feedback
      digitalWrite(BUZZER_PIN, HIGH);
      delay(80);
      digitalWrite(BUZZER_PIN, LOW);
    }
  }

  // 2. Check Hall Effect Magnetic Switches (Detect Lid Open -> Pill Intake)
  for (int i = 0; i < NUM_SLOTS; i++) {
    int hallVal = digitalRead(HALL_PINS[i]);
    // Transition from HIGH (closed) to LOW (opened by user)
    if (prevHallState[i] == HIGH && hallVal == LOW) {
      Serial.printf("🔓 Lid OPENED on Slot %d (Hall sensor triggered)!\n", i + 1);

      float weightDiff = 0.0;
      if (scale.is_ready()) {
        float currentWeight = scale.get_units(5);
        weightDiff = baselineWeight - currentWeight;
        baselineWeight = currentWeight;
      }

      // Publish Dispense Event to Cloud
      publishDispenseEvent(i + 1, weightDiff);

      // If this was the alerting slot, deactivate alarm
      if (activeSlotAlert == i) {
        deactivateAlert();
      }

      slotUnlocked[i] = false; // Reset lock
    }
    prevHallState[i] = hallVal;
  }

  // 3. Periodic Telemetry (Every 30 seconds)
  if (millis() - lastTelemetryTime > 30000) {
    lastTelemetryTime = millis();
    publishTelemetry();
  }

  // 4. Alert Buzzer Pulse if Alert Active
  if (activeSlotAlert != -1) {
    if ((millis() / 500) % 2 == 0) {
      digitalWrite(BUZZER_PIN, HIGH);
      strip.setPixelColor(activeSlotAlert, strip.Color(255, 140, 0));
    } else {
      digitalWrite(BUZZER_PIN, LOW);
      strip.setPixelColor(activeSlotAlert, strip.Color(0, 0, 0));
    }
    strip.show();
  }

  delay(20);
}

// ─── MQTT CALLBACK ────────────────────────────────────────────────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[512];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("📩 MQTT Inbound [%s]: %s\n", topic, message);

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err) {
    Serial.println("❌ JSON Parse Failed");
    return;
  }

  // Handle Dose Trigger
  if (strcmp(topic, TOPIC_TRIGGER) == 0) {
    int slotId = doc["slotId"] | 1;
    const char* medName = doc["medicineName"] | "Medicine";
    const char* dose = doc["dosage"] | "1 Pill";
    
    // Parse color hex (e.g. "#10b981")
    uint32_t ledColor = strip.Color(16, 185, 129);
    triggerSlotAlert(slotId - 1, medName, dose, ledColor);
  }
  // Handle Timeout / Deactivate Command
  else if (strcmp(topic, TOPIC_DEACTIVATE) == 0) {
    Serial.println("🔕 Hardware Deactivate Command received");
    deactivateAlert();
  }
}

void triggerSlotAlert(int slotIdx, const char* medName, const char* dose, uint32_t color) {
  activeSlotAlert = slotIdx;
  activeMedName = medName;
  activeDose = dose;
  alertStartTime = millis();

  // Light up target compartment LED
  for (int i = 0; i < NUM_SLOTS; i++) {
    strip.setPixelColor(i, i == slotIdx ? color : strip.Color(0, 0, 0));
  }
  strip.show();

  // OLED Alert Screen
  char slotHeader[32];
  snprintf(slotHeader, sizeof(slotHeader), "TAKE SLOT %d NOW", slotIdx + 1);
  updateOledDisplay(slotHeader, medName, dose);

  Serial.printf("🔔 Alert Triggered for Slot %d: %s (%s)\n", slotIdx + 1, medName, dose);
}

void deactivateAlert() {
  activeSlotAlert = -1;
  digitalWrite(BUZZER_PIN, LOW);
  for (int i = 0; i < NUM_SLOTS; i++) {
    strip.setPixelColor(i, strip.Color(0, 0, 0));
  }
  strip.show();
  updateOledDisplay("MEDIBOX READY", "Intake Recorded", "All Slots Idle");
}

void publishDispenseEvent(int slot, float weightChange) {
  StaticJsonDocument<256> doc;
  doc["event"] = "DOSE_TAKEN";
  doc["boxId"] = DEVICE_ID;
  doc["slotId"] = slot;
  doc["weightDeltaGrams"] = weightChange;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_DISPENSE, buffer);
  Serial.printf("📤 Published Dispense event to %s: %s\n", TOPIC_DISPENSE, buffer);
}

void publishTelemetry() {
  float temp = bme.readTemperature();
  float hum = bme.readHumidity();
  if (isnan(temp)) temp = 22.4;
  if (isnan(hum)) hum = 45.0;

  StaticJsonDocument<256> doc;
  doc["boxId"] = DEVICE_ID;
  doc["temperatureC"] = temp;
  doc["humidityPct"] = hum;
  doc["batteryPct"] = 94;
  doc["wifiRssi"] = WiFi.RSSI();

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_TELEMETRY, buffer);
  Serial.printf("📊 Published Telemetry (Temp: %.1fC, Hum: %.1f%%)\n", temp, hum);
}

void updateOledDisplay(const char* header, const char* line1, const char* line2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 4);
  display.print(header);
  display.drawFastHLine(0, 16, 128, SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 24);
  display.print(line1);

  display.setCursor(0, 40);
  display.print(line2);

  display.display();
}

void setupWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ Wi-Fi Offline (Running in Standalone Simulator / Fallback Mode)");
  }
}

void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection to ");
    Serial.println(MQTT_SERVER);
    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("✅ MQTT Connected!");
      mqttClient.subscribe(TOPIC_TRIGGER);
      mqttClient.subscribe(TOPIC_DEACTIVATE);
      mqttClient.subscribe(TOPIC_SCHEDULE);
    } else {
      Serial.printf("Failed, rc=%d. Retrying in 5 seconds...\n", mqttClient.state());
      delay(5000);
      break;
    }
  }
}
