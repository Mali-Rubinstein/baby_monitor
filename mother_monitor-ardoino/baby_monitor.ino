#include <TFT9341Touch.h>
#include <glcdfonth.h>
#include "vibration.h"
#include <WiFi.h>
#include <WiFiClient.h>
#include "lcd_display.h"
#include <esp_now.h>
#include "network_comms.h"

const char* ssid = "GALGALIM1";//"Rimon-Fiber-2.4G-Dov";
const char* password = "741741741";//""12345678";
const char* serverIP = "192.168.1.85";
const uint16_t serverPort = 3001;


bool isCrying = false;
WiFiClient client;


// אתחול ESP-NOW
void initESPNowReceiver() {
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed!");
    return;
  }
  esp_now_register_recv_cb(onReceive);
}

void onReceive(const esp_now_recv_info_t* recv_info, const uint8_t* data, int len) {
  String msg = "";
  for (int i = 0; i < len; i++) {
    msg += (char)data[i];
  }

  if (msg == "crying") {
    isCrying = true;  // עדכון מצב
  } else if (msg == "calm") {
    isCrying = false;  // עדכון מצב
  }
}



void setup() {
  Serial.begin(115200);
  initializeLCD();
  showInitialMessage();
  drawCallNurseButton();
  setupVibration();
  initESPNowReceiver();
  connectToWiFi(ssid, password); 
  
}

void loop() {
  handleWiFiConnection(ssid, password);
  bool serverConnected = handleServerConnection(client, serverIP, serverPort);
  updateLCDStatus(isCrying);
  handleVibration(isCrying);
  handleTouch(client);

  delay(1000);
}
