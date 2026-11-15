#pragma once

// Includes necessários
#include <Arduino.h>
#include "Config.h"


// Funções vinculadas ao EMISSOR
void LORA_iniciar_modulo_receptor(){

  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_RECEPTOR, TX_RECEPTOR);

  Serial.println("\n=========================================");
  Serial.println("[BASE - ESP32] RECEPTOR INICIADO");
  Serial.println("=========================================");
  Serial.println("Aguardando telemetria do barco...\n");

}