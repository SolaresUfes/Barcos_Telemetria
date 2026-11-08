#include "RECEPTOR.h"

// Novos pinos 
// Fio LARANJA (TXD do LoRa) - 16
// Fio AMARELO (RXD do LoRa) - 17

void setup() {
  Serial.begin(BAUD_SERIAL);
  LORA_iniciar_modulo_receptor();
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

void LORA_iniciar_modulo_receptor(){

  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_RECEPTOR, TX_RECEPTOR);

  Serial.println("\n=========================================");
  Serial.println("[BASE - ESP32] RECEPTOR INICIADO");
  Serial.println("=========================================");
  Serial.println("Aguardando telemetria do barco...\n");

}
