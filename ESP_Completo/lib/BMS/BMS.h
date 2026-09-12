#pragma once

#include <Arduino.h>
#include "Estruturas.h"


/* --- DECLARAÇÕES --- */

// Inicia as coisas relacionadas ao BMS (pino de comunicação, definições iniciais de leitura/escrita e coisas do MAX485)
void BMS_iniciar();

// Lê os dados do bms relacionados a "status_geral[]"
DADOS_BATERIA BMS_ler_dados();

// Lê os dados do bms relacionados a "falhas[]"
ALERTAS_BATERIA BMS_ler_alertas();

// Lê os dados do bms relacionados a "cel_individual[]"
CELULAS_INDIVIDUAIS BMS_ler_celulas();

// Interpreta os dados de falhas/alertas vindos do BMS pra uma melhor manipulação dos mesmos
ALERTAS_BATERIA BMS_interpretador(byte resposta[13]);