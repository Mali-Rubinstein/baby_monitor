#ifndef MOTION_SENSOR_H
#define MOTION_SENSOR_H
#include <esp_now.h>

extern uint8_t motherMac[];  // הכרזה על משתנה חיצוני
#include <Arduino.h>
#include <WiFiClient.h>

extern const int MOTION_PIN;
extern volatile bool motionChanged;
extern volatile bool motionState;
extern bool isCrying;
extern int currentPressureValue;
extern WiFiClient client;


void sendJsonToServer(WiFiClient& client, String jsonString);


// שליחת סטטוס בכי
void sendCryStatus(bool crying) {
  const char* msg = crying ? "crying" : "calm";
  esp_now_send(motherMac, (uint8_t*)msg, strlen(msg));
}

void handleMotionChange() {
  static bool previouslyCrying = false;
  static unsigned long motionStartTime = 0;

  if (motionChanged) {
    motionChanged = false;

    if (motionState) {
      // התחילה תנועה
      motionStartTime = millis();
    } else {
      // הסתיימה תנועה לפני שהספיקה להחזיק 5 שניות
      motionStartTime = 0;
    }
  }

  // אם יש תנועה פעילה ונמשכת יותר מ־5 שניות
  if (motionState && motionStartTime > 0 && (millis() - motionStartTime >= 1500)) {
    isCrying = true;
  } else {
    isCrying = false;
  }

  if (isCrying != previouslyCrying) {
    previouslyCrying = isCrying;
    sendCryStatus(isCrying);  // <<== שליחת מצב עדכני
    if (isCrying) {
      Serial.println("\n*********************************");
      Serial.println("***** Baby is Crying! *****");
      Serial.println("*********************************\n");
    } else {
      Serial.println("\n*********************************");
      Serial.println("***** Baby is Calm Now. *****");
      Serial.println("*********************************\n");
    }
  }
}

// שליחת עדכון כללי של המצב הנוכחי (לחץ + בכי/שקט)
void sendGeneralStatusUpdate(WiFiClient& client) {
  String statusStr = isCrying ? "בוכה" : "רגוע";
  String statusJson = "{\"id\":\"baby1\",\"pressure\":" + String(currentPressureValue) + ",\"status\":\"" + statusStr + "\"}";

  if (client.connected()) {
    sendJsonToServer(client, statusJson);
  } else {
    Serial.println(statusJson);
  }
}

#endif
