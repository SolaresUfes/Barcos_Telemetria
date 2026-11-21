#pragma once

#include <Arduino.h>
#include <Config_defs.h>
#include <Estruturas.h>

// Controle dos pinos de modo (M0 e M1)
void LORA_iniciar_pinos_config();
void LORA_definir_modo(LoRaOperatingMode modo);

// Gravação e leitura dos registradores do módulo
bool LORA_configurar_modulo(const LoRaConfig& cfg, bool salvarNaEeprom = false);
bool LORA_ler_configuracao();

// Mantida para compatibilidade com chamadas existentes
bool configurarPotenciaLoRa();