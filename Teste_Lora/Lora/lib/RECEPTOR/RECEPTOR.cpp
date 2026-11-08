#include <Arduino.h>

// Novos pinos 
#define RXD2 16 // Fio LARANJA (TXD do LoRa)
#define TXD2 17 // Fio AMARELO (RXD do LoRa)

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
  Serial.println("\n=========================================");
  Serial.println("[BASE - ESP32] RECEPTOR INICIADO");
  Serial.println("=========================================");
  Serial.println("Aguardando telemetria do barco...\n");
}

void loop() {
  // Verifica se chegou alguma coisa pelo rádio
  if (Serial2.available()) {
    // Lê o pacote inteiro até encontrar uma quebra de linha (enter)
    String pacoteRecebido = Serial2.readStringUntil('\n');
    
    // Remove espaços em branco ou ruído elétrico do final da string
    pacoteRecebido.trim(); 
    
    // Só imprime na tela se realmente tiver texto (ignora ecos vazios)
    if (pacoteRecebido.length() > 0) {
      Serial.print(">> CHEGOU: ");
      Serial.println(pacoteRecebido);
    }
  }
}
