#pragma once

// Includes necessários
#include <Arduino.h>
#include "Config.h"


// Funções vinculadas ao EMISSOR
void LORA_iniciar_modulo_emissor(){

  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_EMISSOR, TX_EMISSOR);
  
  Serial.println("\n=========================================");
  Serial.println("[BARCO - S3] TRANSMISSOR INICIADO");
  Serial.println("=========================================");

}