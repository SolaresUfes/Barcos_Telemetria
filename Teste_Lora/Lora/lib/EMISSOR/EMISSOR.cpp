#include <Arduino.h>

// Pinos
#define RXD2 15 // Fio AMARELO (RXD do LoRa)
#define TXD2 16 // Fio LARANJA (TXD do LoRa) 

int contador = 1;

void setup() {
  Serial.begin(115200);
  
  // O LoRa está configurado para 9600 bps no ar e na serial
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
  Serial.println("\n=========================================");
  Serial.println("[BARCO - S3] TRANSMISSOR INICIADO");
  Serial.println("=========================================");
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
