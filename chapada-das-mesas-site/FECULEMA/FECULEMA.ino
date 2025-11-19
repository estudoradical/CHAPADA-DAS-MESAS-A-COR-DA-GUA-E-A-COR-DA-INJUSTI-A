#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --------------------------
// CONFIGURAÇÃO DOS SENSORES
// --------------------------

// DHT11 ou DHT22 --> troque DHT11 para DHT22 se necessário
#define DHTPIN 9
#define DHTTYPE DHT11  
DHT dht(DHTPIN, DHTTYPE);

// Sensor UV GUVA-S12SD
#define UV_PIN A1

// MQ-135
#define MQ135_PIN A0

// DS18B20 - Temperatura da água
#define ONE_WIRE_BUS 13
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);


// --------------------------
// INICIALIZAÇÃO
// --------------------------
void setup() {
  Serial.begin(9600);
  dht.begin();
  sensors.begin();
  delay(1500);
}


// --------------------------
// LOOP PRINCIPAL
// --------------------------
void loop() {

  // Leitura do DHT
  float humidity = dht.readHumidity();
  float tempAir = dht.readTemperature();

  // MQ-135
  int mqRaw = analogRead(MQ135_PIN);
  int airQualityPPM = map(mqRaw, 0, 1023, 50, 500); // valor estimado

  // UV GUVA — converte para aproximado em mW/cm2
  int uvRaw = analogRead(UV_PIN);
  float uvVoltage = uvRaw * (5.0 / 1023.0);
  int uvIndex = uvVoltage * 100;   // leitura simplificada para UV

  // DS18B20 Temperatura da Água
  sensors.requestTemperatures();
  float tempWater = sensors.getTempCByIndex(0);

  // Se o sensor não estiver conectado, retorna 0
  if (tempWater < -20 || tempWater > 85) tempWater = 0;

  // --------------------------
  // ENVIO EM JSON PARA O SITE
  // --------------------------
  Serial.print("{");
  Serial.print("\"uv\":"); Serial.print(uvIndex); Serial.print(",");
  Serial.print("\"air\":"); Serial.print(airQualityPPM); Serial.print(",");
  Serial.print("\"humidity\":"); Serial.print(humidity); Serial.print(",");
  Serial.print("\"tempAir\":"); Serial.print(tempAir); Serial.print(",");
  Serial.print("\"tempWater\":"); Serial.print(tempWater);
  Serial.println("}");

  delay(1000); // 1 leitura por segundo
}
