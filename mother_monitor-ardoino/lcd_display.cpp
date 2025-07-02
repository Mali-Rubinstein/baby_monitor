#include "lcd_display.h"
#include <SPI.h>
#include <WiFiClient.h>
#include <TFT9341Touch.h>
#include <TouchScreen.h>
#include <time.h>  // עבור המרת זמן

// הגדרות מיקום וגודל של כפתור "Call Nurse"
#define CALL_BUTTON_X 60
#define CALL_BUTTON_Y 150
#define CALL_BUTTON_WIDTH 120
#define CALL_BUTTON_HEIGHT 40


tft9341touch lcd(5, 4, 15, 35);  // הגדרת הפינים של המסך


extern void sendJsonToServer(WiFiClient& client, String jsonString);

// אתחול ראשוני של המסך – הגדרת כיוון ומילוי רקע
void initializeLCD() {
  lcd.begin();
  lcd.setRotation(2);
  lcd.fillScreen(0x0000);
}

// הצגת הודעה ראשונית על המסך
void showInitialMessage() {
  lcd.setCursor(100, 40);
  lcd.setTextSize(2);
  lcd.setTextColor(0xFFFF);
  lcd.print("Hello World");

  lcd.setCursor(60, 80);
  lcd.setTextSize(3);
  lcd.print("Hello World");
}

// עדכון סטטוס המסך בהתאם לשאלה אם התינוק בוכה או רגוע
void updateLCDStatus(bool isCrying) {
  lcd.fillRect(10, 40, 220, 100, 0x0000);
  lcd.setCursor(10, 40);
  lcd.setTextSize(2);
  lcd.setTextColor(0x07E0);
  lcd.setCursor(10, 100);
  lcd.setTextSize(2);
  lcd.setTextColor(isCrying ? 0xF800 : 0x07E0);
  lcd.print(isCrying ? "Baby is crying" : "Baby is calm");
}

// ציור כפתור "Call Nurse" על המסך
void drawCallNurseButton() {
  uint16_t buttonColor = 0x001F;
  uint16_t textColor = 0xFFFF;

  lcd.fillRoundRect(CALL_BUTTON_X, CALL_BUTTON_Y, CALL_BUTTON_WIDTH, CALL_BUTTON_HEIGHT, 8, buttonColor);  // מילוי כפתור
  lcd.drawRoundRect(CALL_BUTTON_X, CALL_BUTTON_Y, CALL_BUTTON_WIDTH, CALL_BUTTON_HEIGHT, 8, 0x07FF);       // מסגרת לכפתור

  lcd.setTextSize(2);
  lcd.setTextColor(textColor);

  lcd.setCursor(CALL_BUTTON_X + (CALL_BUTTON_WIDTH - (8 * 6 * 2)) / 2, CALL_BUTTON_Y + (CALL_BUTTON_HEIGHT - (8 * 2)) / 2);
  lcd.setCursor(CALL_BUTTON_X + (CALL_BUTTON_WIDTH - (8 * 6 * 2)) / 2, CALL_BUTTON_Y + (CALL_BUTTON_HEIGHT - (8 * 2)) / 2);
  lcd.print("Call Nurse");
}

// זיהוי מגע במסך – אם נגעו בכפתור, שינוי צבע ושליחת בקשת עזרה
bool handleTouch(WiFiClient& client) {
  if (lcd.touched()) {  
    lcd.readTouch();    
    int x = lcd.xTouch;
    int y = lcd.yTouch;

    Serial.print("Touch detected at: (");
    Serial.print(x);
    Serial.print(", ");
    Serial.print(y);
    Serial.println(")");


    lcd.fillRoundRect(CALL_BUTTON_X, CALL_BUTTON_Y, CALL_BUTTON_WIDTH, CALL_BUTTON_HEIGHT, 8, 0x07E0);  // ירוק
    lcd.setTextSize(2);
    lcd.setTextColor(0x0000);  // טקסט שחור
    lcd.setCursor(CALL_BUTTON_X + (CALL_BUTTON_WIDTH - (8 * 6 * 2)) / 2,
                  CALL_BUTTON_Y + (CALL_BUTTON_HEIGHT - (8 * 2)) / 2);
    lcd.print("Call Nurse");

    Serial.println("Call Nurse button pressed!");

   
    String callNurseJson = "{\"id\":\"baby1\",\"event\":\"call_nurse\",\"message\":\"Call from Mother\"}\n";
    Serial.println(callNurseJson);

    // שליחת המידע לשרת אם יש חיבור
    if (client.connected()) {
      sendJsonToServer(client, callNurseJson);
    }

    delay(300);             // המתנה קצרה
    drawCallNurseButton();  // ציור הכפתור מחדש אחרי הלחיצה
    return true;
  }
  return false;  // לא נלחץ
}
