#include "EMISSOR.h"

// Pinos
// Fio AMARELO (RXD do LoRa) - 15
// Fio LARANJA (TXD do LoRa) - 16

void LORA_iniciar_modulo_emissor(){

  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_EMISSOR, TX_EMISSOR);
  
  Serial.println("\n=========================================");
  Serial.println("[BARCO - S3] TRANSMISSOR INICIADO");
  Serial.println("=========================================");

}

void LORA_enviar_pacote(String dados) {
  // Envia a string pelo rádio LoRa com quebra de linha (\n) no final
  Serial2.println(dados);
  
  // Imprime no monitor do PC pra debug
  Serial.print("Transmitindo: ");
  Serial.println(dados);
}
