#ifndef LCD_DISPLAY_H
#define LCD_DISPLAY_H

#include <TFT9341Touch.h>
#include <glcdfonth.h>
#include <WiFiClient.h> 

extern tft9341touch lcd;

const int CALL_BUTTON_X = 50;
const int CALL_BUTTON_Y = 180;
const int CALL_BUTTON_WIDTH = 140;
const int CALL_BUTTON_HEIGHT = 50;

void initializeLCD();
void showInitialMessage();
void updateLCDStatus( bool isCrying);  // שים לב לשינוי כאן!
void drawCallNurseButton();
bool handleTouch(WiFiClient& client);

#endif
