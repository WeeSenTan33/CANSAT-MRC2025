#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>
#include <SD.h>

// Sensors (leave installed if you use them)
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <MPU9250_asukiaaa.h>

// ---------- GPS (kept same pins & baud you used) ----------
static const uint8_t GPS_RX_PIN = 0;   // Arduino receives from GPS TX
static const uint8_t GPS_TX_PIN = 1;   // Arduino transmits to GPS RX
static const uint32_t GPS_BAUD  = 9600;

SoftwareSerial gpsSS(GPS_RX_PIN, GPS_TX_PIN); // RX, TX
TinyGPSPlus gps;

// ---------- APC220 (TX radio) ----------
static const uint8_t APC_RX_PIN = 9;   // Arduino receives from APC TXD (not used)
static const uint8_t APC_TX_PIN = 10;  // Arduino transmits to APC RXD
static const uint32_t APC_BAUD  = 9600;

SoftwareSerial apcSS(APC_RX_PIN, APC_TX_PIN); // RX, TX (we TX only)

// ---------- Optional sensors ----------
Adafruit_BMP280 bmp;
MPU9250_asukiaaa imu;
static const float SEA_LEVEL_HPA = 1013.25f;
bool bmpOK = false, imuOK = false;

#define SD_CS_PIN 4  // Chip Select pin for SD module
File logFile;
char filename[30] = "DATA_DEFAULT.CSV";  // Default fallback
bool fileCreated = false;                // To ensure header is only written once
unsigned long packetNumber = 1;
#define CALLSIGN "AEROBOLT"

// ---------- Malaysia time helpers (UTC+8) ----------
static const int8_t TZ_OFFSET_H = 8;
inline bool isLeap(uint16_t y) { return (y % 4 == 0) && ((y % 100) != 0 || (y % 400) == 0); }
uint8_t dim(uint16_t y, uint8_t m) {
  static const uint8_t d[12] = {31,28,31,30,31,30,31,31,30,31,30,31};
  return (m == 2 && isLeap(y)) ? 29 : d[m - 1];
}
void applyTzUTCtoMYT(uint16_t &Y, uint8_t &M, uint8_t &D, int16_t &H) {
  H += TZ_OFFSET_H;
  while (H >= 24) { H -= 24; D++; if (D > dim(Y, M)) { D = 1; M++; if (M > 12) { M = 1; Y++; } } }
  while (H < 0)    { H += 24; D--; if (D < 1)       { M--; if (M < 1)  { M = 12; Y--; } D = dim(Y, M); } }
}

void setup() {
  Serial.begin(9600);       // USB Serial Monitor (Laptop A)
  gpsSS.begin(GPS_BAUD);    // GPS
  apcSS.begin(APC_BAUD);    // APC220 radio

  gpsSS.listen();           // With two SoftwareSerial ports, choose GPS as the active listener
  Wire.begin();

  // Optional sensors init
  if (bmp.begin(0x76) || bmp.begin(0x77)) {
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16,
                    Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_63);
    bmpOK = true;
  }
  imu.setWire(&Wire);
  imu.beginAccel(); imu.beginGyro(); imu.beginMag();
  delay(150);
  imuOK = true;

  Serial.println(F("TX ready: USB+APC220 @ 9600. GPS on D0/D1, APC on D7/D9."));

  if (SD.begin(SD_CS_PIN)) {
    logFile = SD.open(filename, FILE_WRITE);
    if (logFile) {
      logFile.println(F("packet no,date,time,latitude,longitude,temp,pressure,altitude,gx,gy,gz,ax,ay,az,vz,sat,hdop"));
      logFile.close();
      Serial.println(F("SD card initialized, logging to csv file"));
    } else {
      Serial.println(F("Failed to open csv file for writing."));
    }
  } else {
    Serial.println(F("SD card initialize failed!"));
  }
}

void loop() {
  gpsSS.listen();
  while (gpsSS.available()) gps.encode(gpsSS.read());
  int satCount = gps.satellites.isValid() ? gps.satellites.value() : -1;
  float hdop = gps.hdop.isValid() ? gps.hdop.hdop() : -1.0;

  static uint32_t last = 0;
  uint32_t now = millis();
  if (now - last < 1000) return;
  last += 1000;

  bool haveFix = gps.location.isValid();
  double lat   = haveFix ? gps.location.lat() : 0.0;
  double lon   = haveFix ? gps.location.lng() : 0.0;
  double spdMS = gps.speed.isValid() ? gps.speed.mps() : 0.0;
  double gpsAlt= gps.altitude.isValid() ? gps.altitude.meters() : 0.0;

  char dateBuf[16] = "";
  char timeBuf[16] = "";

  if (gps.date.isValid() && gps.time.isValid()) {
    uint16_t Y = gps.date.year();
    uint8_t M = gps.date.month();
    uint8_t D = gps.date.day();
    int16_t h = gps.time.hour();
    uint8_t m = gps.time.minute();
    uint8_t s = gps.time.second();
    applyTzUTCtoMYT(Y, M, D, h);

    snprintf(dateBuf, sizeof(dateBuf), "%04u-%02u-%02u", Y, M, D);
    snprintf(timeBuf, sizeof(timeBuf), "%02d:%02u:%02u", (int)h, m, s);

    if (!fileCreated) {
      snprintf(filename, sizeof(filename), "D%02u%02u%02u.CSV", D, h, m);  // or use your MMDD-HHMMSS version
      logFile = SD.open(filename, FILE_WRITE);
      if (logFile) {
        logFile.println(F("packet,callsign,date,time,latitude,longitude,temp,pressure,altitude,gx,gy,gz,ax,ay,az,vz,sat,hdop"));
        logFile.close();
        Serial.print(F("Created new file: ")); Serial.println(filename);
        fileCreated = true;
      } else {
        Serial.println(F("Failed to create new file after GPS lock"));
      }
    }
  }

  float tempC = 0, presPa = 0, baroAlt = 0;
  if (bmpOK) {
    tempC = bmp.readTemperature();
    presPa = bmp.readPressure();
    baroAlt = bmp.readAltitude(SEA_LEVEL_HPA);
  }

  float gx = 0, gy = 0, gz = 0;
  float ax = 0, ay = 0, az = 0;
  if (imuOK) {
    imu.gyroUpdate(); gx = imu.gyroX(); gy = imu.gyroY(); gz = imu.gyroZ();
    imu.accelUpdate(); ax = imu.accelX(); ay = imu.accelY(); az = imu.accelZ();
  }

  float accMag = sqrt(ax * ax + ay * ay + az * az);

  double altM = bmpOK ? (double)baroAlt : gpsAlt;

  // ===== Vertical Rate Calculation =====
  static double lastAlt = 0;
  static uint32_t lastAltTime = 0;

  double verticalSpeed = 0; // m/s
  uint32_t nowMs = millis();

  if (lastAltTime > 0 && nowMs > lastAltTime) {
    double deltaAlt = altM - lastAlt;
    double deltaTime = (nowMs - lastAltTime) / 1000.0; // in seconds
    verticalSpeed = deltaAlt / deltaTime;
  }

  lastAlt = altM;
  lastAltTime = nowMs;

  // ---- Emit JSON to USB ----
  Serial.print('{');
  bool first = true; auto sep = [&]() { if (first) first = false; else Serial.print(','); };
  sep(); Serial.print(F("\"callsign\":\"")); Serial.print(CALLSIGN); Serial.print('"');
  if (dateBuf[0]) { sep(); Serial.print(F("\"date\":\"")); Serial.print(dateBuf); Serial.print('"'); }
  if (timeBuf[0]) { sep(); Serial.print(F("\"time\":\"")); Serial.print(timeBuf); Serial.print('"'); }
  if (haveFix)    { sep(); Serial.print(F("\"latitude\":")); Serial.print(lat, 6);
                    sep(); Serial.print(F("\"longitude\":")); Serial.print(lon, 6); }
  sep(); Serial.print(F("\"temp\":")); Serial.print(tempC, 2);
  sep(); Serial.print(F("\"pressure\":")); Serial.print(presPa, 0);
  sep(); Serial.print(F("\"altitude\":")); Serial.print(altM, 2);
  sep(); Serial.print(F("\"accleration\":")); Serial.print(accMag, 3);
  sep(); Serial.print(F("\"gx\":")); Serial.print(gx, 3);
  sep(); Serial.print(F("\"gy\":")); Serial.print(gy, 3);
  sep(); Serial.print(F("\"gz\":")); Serial.print(gz, 3);
  sep(); Serial.print(F("\"ax\":")); Serial.print(ax, 3);
  sep(); Serial.print(F("\"ay\":")); Serial.print(ay, 3);
  sep(); Serial.print(F("\"az\":")); Serial.print(az, 3);
  sep(); Serial.print(F("\"vz\":")); Serial.print(verticalSpeed, 2);
  sep(); Serial.print(F("\"sat\":")); Serial.print(satCount);
  sep(); Serial.print(F("\"hdop\":")); Serial.print(hdop, 2);
  Serial.println('}');

  // ---- Mirror to APC220 ----
  apcSS.print('{');
  bool first2 = true; auto sep2 = [&]() { if (first2) first2 = false; else apcSS.print(','); };
  sep2(); apcSS.print(F("\"callsign\":\"")); apcSS.print(CALLSIGN); apcSS.print('"');
  if (dateBuf[0]) { sep2(); apcSS.print(F("\"date\":\"")); apcSS.print(dateBuf); apcSS.print('"'); }
  if (timeBuf[0]) { sep2(); apcSS.print(F("\"time\":\"")); apcSS.print(timeBuf); apcSS.print('"'); }
  if (haveFix)    { sep2(); apcSS.print(F("\"latitude\":")); apcSS.print(lat, 6);
                    sep2(); apcSS.print(F("\"longitude\":")); apcSS.print(lon, 6); }
  sep2(); apcSS.print(F("\"temp\":")); apcSS.print(tempC, 2);
  sep2(); apcSS.print(F("\"pressure\":")); apcSS.print(presPa, 0);
  sep2(); apcSS.print(F("\"altitude\":")); apcSS.print(altM, 2);
  sep2(); apcSS.print(F("\"acceleration\":")); apcSS.print(accMag, 3);
  sep2(); apcSS.print(F("\"gx\":")); apcSS.print(gx, 3);
  sep2(); apcSS.print(F("\"gy\":")); apcSS.print(gy, 3);
  sep2(); apcSS.print(F("\"gz\":")); apcSS.print(gz, 3);
  sep2(); apcSS.print(F("\"ax\":")); apcSS.print(ax, 3);
  sep2(); apcSS.print(F("\"ay\":")); apcSS.print(ay, 3);
  sep2(); apcSS.print(F("\"az\":")); apcSS.print(az, 3);
  sep2(); apcSS.print(F("\"vz\":")); apcSS.print(verticalSpeed, 2);
  sep2(); apcSS.print(F("\"sat\":")); apcSS.print(satCount);
  sep2(); apcSS.print(F("\"hdop\":")); apcSS.print(hdop, 2);
  apcSS.println('}');

  logFile = SD.open(filename, FILE_WRITE);
  if (logFile) {
    logFile.print(packetNumber); logFile.print(",");
    logFile.print(CALLSIGN);    logFile.print(",");
    logFile.print(dateBuf);      logFile.print(",");
    logFile.print(timeBuf);      logFile.print(",");
    logFile.print(lat, 6);       logFile.print(",");
    logFile.print(lon, 6);       logFile.print(",");
    logFile.print(tempC, 2);     logFile.print(",");
    logFile.print(presPa, 0);    logFile.print(",");
    logFile.print(altM, 2);      logFile.print(",");
    logFile.print(accMag, 2);     logFile.print(",");
    logFile.print(gx, 3);        logFile.print(",");
    logFile.print(gy, 3);        logFile.print(",");
    logFile.print(gz, 3);        logFile.print(",");
    logFile.print(ax, 3);        logFile.print(",");
    logFile.print(ay, 3);        logFile.print(",");
    logFile.print(az, 3);      logFile.print(",");
    logFile.print(verticalSpeed, 2);      logFile.print(","); 
    logFile.print(satCount);   logFile.print(",");
    logFile.println(hdop, 2);
    logFile.close();
    packetNumber++;
  } else {
    Serial.println(F("Error writing to SD"));
  }
}
