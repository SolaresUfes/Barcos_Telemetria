#include <Wire.h>
#include <Adafruit_ADS1X15.h>

Adafruit_ADS1115 ads;

// Fator de conversão exato para o Ganho de 2x (±2.048V)
// 2.048 Volts / 32768 Passos = 0.0000625 Volts por bit
const double VOLTS_PER_BIT = 0.0000625; 

// Tensão fixa de referência injetada no pino AIN1
const double V_REF = 2.50000; 

void setup(void) {
  Serial.begin(115200);
  Wire.begin(21, 22); // Pinos I2C padrão do ESP32 (SDA, SCL)

  if (!ads.begin()) Serial.println("Falha ao iniciar o ADS1115!");

  // Define o ganho máximo seguro para o sinal diferencial (0V a 2.0V)
  // GAIN_TWO expande a escala para ±2.048V
  ads.setGain(GAIN_TWO); 
}

void loop(void) {
  // Lê a diferença real entre AIN0 (Sensor) e AIN1 (Referência de 2.5V)
  int16_t results = ads.readADC_Differential_0_3();
//   int16_t results = ads.readADC_SingleEnded();

  // Converte a leitura de bits para a diferença em Volts
  double v_diferencial = results * VOLTS_PER_BIT;

  // Soma a referência para obter a tensão real do sensor
  double v_sensor = v_diferencial + V_REF;

  // Imprime o resultado formatado com 5 casas decimais
  // Usamos 'double' no ESP32 pois ele suporta 15 dígitos de precisão total
  Serial.print("Tensao do Sensor Hall: ");
  Serial.print(v_sensor, 5); 
  Serial.println(" V");

  delay(200);
}