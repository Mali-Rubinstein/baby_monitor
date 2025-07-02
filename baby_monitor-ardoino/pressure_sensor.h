#ifndef PRESSURE_SENSOR_H
#define PRESSURE_SENSOR_H

#include <Arduino.h>
#include <WiFiClient.h>
#include <time.h>  // ← במקום TimeLib.h

// משתנים חיצוניים
extern const int PRESSURE_PIN;
extern const int PRESSURE_THRESHOLD_DRINKING;
extern const int DRINKING_DEBOUNCE_TIME;
extern const int MIN_DRINKING_DURATION_FOR_MEAL;

extern unsigned long lastPressureChangeTime;
extern bool currentlyDrinking;
extern int currentPressureValue;
extern bool mealInProgress;
extern unsigned long mealStartTime;

void sendJsonToServer(WiFiClient& client, String jsonString);

// 🕒 את זה יש לקרוא ב־setup():
// אתחול סנכרון זמן עם שרתי NTP (כולל שעון ישראל ושעון קיץ)
void initTimeSync() {
  configTime(0, 0, "il.pool.ntp.org", "time.nist.gov");  // שרתי NTP
  setenv("TZ", "IST-2IDT,M3.4.4/26,M10.5.0", 1);         // אזור זמן ישראל כולל שעון קיץ
  tzset();


  // חכה עד שהזמן מסתנכרן
  Serial.print("סנכרון עם NTP");
  time_t nowSecs = time(nullptr);
  while (nowSecs < 100000) {
    delay(500);
    Serial.print(".");
    nowSecs = time(nullptr);
  }
  Serial.println();
  Serial.print("הזמן כעת: ");
  Serial.println(ctime(&nowSecs));
}

// קריאת חיישן לחץ
void readPressureSensorAndDetectDrinking() {
  currentPressureValue = analogRead(PRESSURE_PIN);
  bool pressureHighEnoughForDrinking = (currentPressureValue > PRESSURE_THRESHOLD_DRINKING);

  if (pressureHighEnoughForDrinking != currentlyDrinking) {
    if (millis() - lastPressureChangeTime > DRINKING_DEBOUNCE_TIME) {
      currentlyDrinking = pressureHighEnoughForDrinking;
      lastPressureChangeTime = millis();
    }
  } else {
    lastPressureChangeTime = millis();
  }
}

// מעקב אחר אירועי האכלה
bool mealDataSent = false;

void handleMealEvents(WiFiClient& client) {
  time_t nowSecs;
  time(&nowSecs);

  if (currentlyDrinking && !mealInProgress) {
    mealInProgress = true;
    mealStartTime = nowSecs;
    mealDataSent = false;

    char formattedTime[30];
    time_t startTime = (time_t)mealStartTime;
    strftime(formattedTime, sizeof(formattedTime), "%Y-%m-%d %H:%M:%S", localtime(&startTime));

    String mealStartedJson = "{\"id\":\"baby1\",\"event\":\"meal_started\",\"mealStartTime\":\"" + String(formattedTime) + "\"}";

    if (client.connected()) {
      sendJsonToServer(client, mealStartedJson);
    } else {
      Serial.println(mealStartedJson);
    }

  }

  else if (!currentlyDrinking && mealInProgress && !mealDataSent) {
    unsigned long mealEndTime = nowSecs;
    unsigned long currentMealDuration = mealEndTime - mealStartTime;

    if (currentMealDuration >= MIN_DRINKING_DURATION_FOR_MEAL) {
      String mealEndedJson = "{\"id\":\"baby1\",\"event\":\"meal_ended\",\"mealStartTime\":" + String(mealStartTime * 1000) + ",\"mealEndTime\":" + String(mealEndTime * 1000) + ",\"mealDuration\":" + String(currentMealDuration) + "}";
     
      if (client.connected()) {
        sendJsonToServer(client, mealEndedJson);
      } else {
        Serial.println(mealEndedJson);
      }

      mealDataSent = true;
    }

    mealInProgress = false;
  }
}

#endif