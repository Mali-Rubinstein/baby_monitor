#define VIBRATION_PIN 27  // הפין שמחובר לרכיב הרטט

void setupVibration() {
  pinMode(VIBRATION_PIN, OUTPUT); // קריאה חד-פעמית ב־setup
}

// פונקציה שמקבלת אם התינוק בוכה או לא
void handleVibration(bool isCrying) {
  if (isCrying) {
    digitalWrite(VIBRATION_PIN, HIGH);  // הפעלת רטט
  } else {
    digitalWrite(VIBRATION_PIN, LOW);   // כיבוי רטט
  }
}
