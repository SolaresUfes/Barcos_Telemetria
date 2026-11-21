#pragma once

// Includes necessários
#include <Arduino.h>
#include "Config.h"

void LORA_iniciar_modulo_emissor();
void LORA_enviar_pacote(String dados);

// Funções vinculadas ao EMISSOR

