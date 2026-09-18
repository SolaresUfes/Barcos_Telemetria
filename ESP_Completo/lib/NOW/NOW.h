#pragma once

#include "Estruturas.h"
#include "Config.h"

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <cstring>

#define RAND_MAX __RAND_MAX


/* --- DEFINIÇÕES --- */

// O transmissor usa o Wi-Fi apenas para descobrir o canal do display.
// Depois disso, ele sai do roteador e transmite somente por ESP-NOW.
static constexpr char NOME_REDE_WIFI[] = "Telemeteam";
static constexpr char SENHA_REDE_WIFI[] = "telemeteam157";

// Canal usado somente se o roteador não estiver disponível ao iniciar.
static constexpr uint8_t CANAL_ESPNOW_RESERVA = 1;

// Envia uma amostra nova a cada segundo.
static constexpr uint32_t INTERVALO_ENVIO_MS = 1000;

// Broadcast permite transmitir sem cadastrar o MAC do display.
static const uint8_t ENDERECO_BROADCAST[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// Estes valores são idênticos aos usados pelo receptor do display.
static constexpr uint16_t VERSAO_PACOTE_TELEMETRIA = 1;

static uint8_t canal_espnow = CANAL_ESPNOW_RESERVA;
static uint32_t proxima_sequencia = 0;
static uint32_t ultimo_envio_ms = 0;
static bool espnow_pronto = false;


/* --- DECLARAÇÕES --- */

static float ler_bateria_barco_percentual();

static float ler_corrente_amperes();

// Conecta brevemente ao roteador apenas para descobrir o canal de rádio.
static uint8_t descobrir_canal_do_display();

// Faz a inicialização da comunicação usando ESP_NOW
static bool iniciar_espnow();

// Envio dos dados para a tela do barco usando ESP_NOW
static void enviar_telemetria();
