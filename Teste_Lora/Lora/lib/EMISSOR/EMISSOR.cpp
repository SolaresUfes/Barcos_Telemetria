#include "EMISSOR.h"

// Pinos
// Fio AMARELO (RXD do LoRa) - 15
// Fio LARANJA (TXD do LoRa) - 16

int contador = 1;

void setup() {
  Serial.begin(BAUD_SERIAL);
  
  // O LoRa está configurado para 9600 bps no ar e na serial
  LORA_iniciar_modulo_emissor();  
}

void loop() {
  // Cria um pacote de dados simulando a telemetria do Solares
  String pacote = "TELEMETRIA_SOLARES | Pacote_ID: " + String(contador);
  
  // Envia a string pelo rádio LoRa
  Serial2.println(pacote);
  
  // Imprime no monitor do PC pra saber o que acabou de sair
  Serial.print("Transmitindo: ");
  Serial.println(pacote);
  
  contador++;
  
  // Aguarda 1 segundo (1000 ms) antes do próximo envio
  delay(1000); 
}
