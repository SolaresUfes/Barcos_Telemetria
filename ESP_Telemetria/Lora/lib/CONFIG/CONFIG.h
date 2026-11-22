#pragma once

#include <Arduino.h>
#include <Config_defs.h>
#include <Estruturas.h>

// Pino AUX (nível ALTO = módulo livre, BAIXO = módulo ocupado)
// LORA_iniciar_aux é idempotente: só configura o pino na primeira chamada para cada GPIO,
// então é seguro chamar antes de um attachInterrupt() sem que ele seja desfeito depois.
void LORA_iniciar_aux(uint8_t pinoAux);
// Espera o AUX ficar ALTO. Retorna false se estourar o timeout (AUX preso em BAIXO ou fio solto).
bool LORA_aguardar_aux_livre(uint8_t pinoAux, uint32_t timeoutMs);

// Controle dos pinos de modo (M0 e M1)
void LORA_iniciar_pinos_config();
void LORA_definir_modo(LoRaOperatingMode modo);

// Gravação e leitura dos registradores do módulo
bool LORA_configurar_modulo(const LoRaConfig& cfg, bool salvarNaEeprom = false);
bool LORA_ler_configuracao();

// Mantida para compatibilidade com chamadas existentes
bool configurarPotenciaLoRa();