#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <time.h>
#include <esp_task_wdt.h>
#include <mbedtls/md.h>

// Hardware Pin Definitions
#define SS_PIN          5
#define RST_PIN         22
#define LED_GREEN_PIN   12
#define LED_RED_PIN     14
#define BUZZER_PIN      13

// Wokwi Simulated NFC Trigger Buttons
#define BTN_NFC1_PIN    25 // Kaelen (04A1B2C3)
#define BTN_NFC2_PIN    26 // Thorin (04B2C3D4)
#define BTN_NFC3_PIN    27 // Elara  (04C3D4E5)

// Watchdog Timeout (8 Seconds)
#define WDT_TIMEOUT_SECONDS 8

// Configuration Constants
const char* WIFI_SSID     = "Wokwi-GUEST"; // Wokwi simulated WiFi (or change to TABERNA_WIFI)
const char* WIFI_PASS     = "";
const char* MQTT_SERVER   = "broker.emqx.io"; // Public broker for Wokwi web simulator (or 192.168.0.200)
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "gremio/scans/hardware";
const char* HMAC_KEY      = "taberna_secret_key_2026";

// Static Memory Buffers (Zero Heap Fragmentation)
static char g_payloadBuffer[256];
static char g_nfcUidBuffer[32];
static char g_sigBuffer[65];

// Objects
MFRC522 mfrc522(SS_PIN, RST_PIN);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Feedback Functions
void triggerSuccessFeedback() {
  digitalWrite(LED_GREEN_PIN, HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(300);
  digitalWrite(LED_GREEN_PIN, LOW);
}

void triggerFailureFeedback() {
  digitalWrite(LED_RED_PIN, HIGH);
  // Double Beep
  digitalWrite(BUZZER_PIN, HIGH); delay(80); digitalWrite(BUZZER_PIN, LOW); delay(80);
  digitalWrite(BUZZER_PIN, HIGH); delay(80); digitalWrite(BUZZER_PIN, LOW);
  delay(300);
  digitalWrite(LED_RED_PIN, LOW);
}

// HMAC-SHA256 Calculation using mbedtls
void computeHmacSha256(const char* data, const char* key, char* outputHex) {
  unsigned char hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key, strlen(key));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)data, strlen(data));
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  for (int i = 0; i < 32; i++) {
    sprintf(outputHex + (i * 2), "%02x", hmacResult[i]);
  }
  outputHex[64] = '\0';
}

void setupWiFiAndNTP() {
  Serial.print("Conectando a WiFi ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Conectado exitosamente!");
    Serial.print("[WiFi] IP Asignada: ");
    Serial.println(WiFi.localIP());
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    Serial.println("[NTP] Sincronizando hora...");
  } else {
    Serial.println("\n[WiFi] Modo Offline / Fallo de conexion.");
  }
}

void reconnectMqtt() {
  if (!mqttClient.connected()) {
    Serial.print("[MQTT] Conectando a Broker ");
    Serial.print(MQTT_SERVER);
    Serial.print("...");
    if (mqttClient.connect("ESP32_Wokwi_NFC_Reader")) {
      Serial.println(" OK!");
    } else {
      Serial.print(" Fallo, rc=");
      Serial.println(mqttClient.state());
    }
  }
}

void sendNfcScan(const char* uidStr) {
  strncpy(g_nfcUidBuffer, uidStr, sizeof(g_nfcUidBuffer));
  time_t now = time(NULL);
  unsigned long timeStamp = (unsigned long)now;
  if (timeStamp < 100000) timeStamp = 1700000000 + (millis() / 1000);

  // Prepare Sign Data string: "NFC_UID:TIMESTAMP"
  static char signData[64];
  snprintf(signData, sizeof(signData), "%s:%lu", g_nfcUidBuffer, timeStamp);

  // Compute HMAC SHA-256
  computeHmacSha256(signData, HMAC_KEY, g_sigBuffer);

  // Build JSON Payload
  snprintf(g_payloadBuffer, sizeof(g_payloadBuffer),
           "{\"nfc_uid\":\"%s\",\"timestamp\":%lu,\"signature\":\"%s\"}",
           g_nfcUidBuffer, timeStamp, g_sigBuffer);

  Serial.print(">>> Publicando Scan NFC en MQTT: ");
  Serial.println(g_payloadBuffer);

  bool published = mqttClient.publish(MQTT_TOPIC, g_payloadBuffer, false);

  if (published) {
    Serial.println(">>> [OK] Scan enviado con exito!");
    triggerSuccessFeedback();
  } else {
    Serial.println(">>> [FAIL] Error al publicar en MQTT!");
    triggerFailureFeedback();
  }
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();

  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  pinMode(BTN_NFC1_PIN, INPUT_PULLUP);
  pinMode(BTN_NFC2_PIN, INPUT_PULLUP);
  pinMode(BTN_NFC3_PIN, INPUT_PULLUP);

  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize Hardware Watchdog (8 Seconds)
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);
  esp_task_wdt_add(NULL);

  setupWiFiAndNTP();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  Serial.println("\n=================================================");
  Serial.println("   >>> ESP32 NFC Reader El Gremio Listo <<<");
  Serial.println(" Wokwi Simulator & Physical Hardware Mode Active");
  Serial.println("=================================================\n");
}

void loop() {
  esp_task_wdt_reset();

  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  // Wokwi Button Triggers
  if (digitalRead(BTN_NFC1_PIN) == LOW) {
    delay(200); // Debounce
    sendNfcScan("04A1B2C3"); // Kaelen
    delay(1000);
  } else if (digitalRead(BTN_NFC2_PIN) == LOW) {
    delay(200);
    sendNfcScan("04B2C3D4"); // Thorin
    delay(1000);
  } else if (digitalRead(BTN_NFC3_PIN) == LOW) {
    delay(200);
    sendNfcScan("04C3D4E5"); // Elara
    delay(1000);
  }

  // Physical MFRC522 SPI Card Scan
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    char uidBuf[32];
    snprintf(uidBuf, sizeof(uidBuf), "%02X%02X%02X%02X",
             mfrc522.uid.uidByte[0], mfrc522.uid.uidByte[1],
             mfrc522.uid.uidByte[2], mfrc522.uid.uidByte[3]);

    sendNfcScan(uidBuf);

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(1000);
  }

  delay(50);
}
