#pragma once

// Includes necessários
#include <Arduino.h>
#include "CONFIG.h"


void LORA_iniciar_modulo_receptor();

static bool tentarRSSI(int& rssi, int& ruido, uint32_t esperaMs);

void LORA_printar_pacote();

void LORA_enviar_pacote(String dados);

int lerIntensidadePacote();
