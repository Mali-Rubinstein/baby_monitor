#include <WiFi.h>
#include <WiFiClient.h>
#include "motion_sensor.h"
#include "pressure_sensor.h"
#include "network_comms.h"
#include <esp_now.h>

const char* ssid = "GALGALIM1";//"Rimon-Fiber-2.4G-Dov";
const char* password = "741741741";//""12345678";
const char* serverIP = "192.168.1.85";
const uint16_t serverPort = 3001;

const int MOTION_PIN = 14;
const int PRESSURE_PIN = 33;

const int PRESSURE_THRESHOLD_DRINKING = 1000;
const int DRINKING_DEBOUNCE_TIME = 500;
const int MIN_DRINKING_DURATION_FOR_MEAL = 5;

unsigned long lastPressureChangeTime = 0;
bool currentlyDrinking = false;
unsigned long mealStartTime = 0;
bool mealInProgress = false;
bool isCrying = false;
int currentPressureValue = 0;

WiFiClient client;

// כתובת MAC של יחידת האם – שנה בהתאם
uint8_t motherMac[] = {0x08, 0xA6, 0xF7, 0x08, 0x40, 0x90};

// משתנים לפסיקה
volatile bool motionChanged = false;
volatile bool motionState = false;

// *** פסיקה ***
void IRAM_ATTR onMotionChange() {
  motionState = digitalRead(MOTION_PIN);
  motionChanged = true;
}

// אתחול ESP-NOW לשידור
void initESPNowSender() {
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed!");
    return;
  }
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, motherMac, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
  }
}



void setup() {
  Serial.begin(115200);
  pinMode(MOTION_PIN, INPUT);
  pinMode(PRESSURE_PIN, INPUT);
  connectToWiFi(ssid, password);
  attachInterrupt(digitalPinToInterrupt(MOTION_PIN), onMotionChange, CHANGE);
  initTimeSync();
  initESPNowSender();  
}

void loop() {
  handleWiFiConnection(ssid, password);
  bool serverConnected = handleServerConnection(client, serverIP, serverPort);
  handleMotionChange();
  readPressureSensorAndDetectDrinking();
  handleMealEvents(client);
  sendGeneralStatusUpdate(client);

  delay(1000);
}
