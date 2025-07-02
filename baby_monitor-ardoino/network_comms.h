#ifndef NETWORK_COMMS_H
#define NETWORK_COMMS_H

#include <WiFi.h>
#include <WiFiClient.h>

extern const char* ssid;
extern const char* password;
extern const char* serverIP;
extern const uint16_t serverPort;


void connectToWiFi(const char* ssid_val, const char* password_val) {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid_val, password_val);

  // נותנים ניסיון חיבור של עד 5 שניות
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 5000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected.");
    Serial.print("ESP32 IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi not connected. Will retry later.");
  }
}

// פונקציה שבודקת אם יש חיבור לרשת WiFi ואם לא – מנסה להתחבר שוב
void handleWiFiConnection(const char* ssid_val, const char* password_val) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.begin(ssid_val, password_val);
    delay(1000);
  }
}

// פונקציה שמתחברת לשרת TCP (לדוגמה: שרת Node.js או כל שרת אחר)
// מחזירה true אם החיבור הצליח, אחרת false
bool handleServerConnection(WiFiClient& client, const char* serverIP_val, const uint16_t serverPort_val) {
  if (!client.connected()) {
    Serial.println("Attempting to connect to TCP server...");
    if (client.connect(serverIP_val, serverPort_val)) {
      Serial.println("Connected to TCP server!");
      return true;
    } else {
      Serial.println("Failed to connect to TCP server. Retrying in 5 seconds...");
      delay(5000);  // ממתין לפני ניסיון חוזר
      return false;
    }
  }
  return true;
}

// פונקציה ששולחת מחרוזת JSON לשרת
void sendJsonToServer(WiFiClient& client, String jsonString) {
  if (client.connected()) {
    client.println(jsonString);
    Serial.print("Sent to server: ");
    Serial.println(jsonString);
  } else {
    Serial.println("Not connected to server, cannot send data.");  // אין חיבור, לא נשלח
  }
}



#endif