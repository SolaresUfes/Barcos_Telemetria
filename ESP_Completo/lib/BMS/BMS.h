#pragma once

#include <Arduino.h>
#include "Estruturas.h"


/* --- DECLARAÇÕES --- */

// Lê os dados do bms relacionados a "status_geral[]"
DADOS_BATERIA ler_dados_bms();

// Lê os dados do bms relacionados a "falhas[]"
ALERTAS_BATERIA ler_alertas_bms();

// Lê os dados do bms relacionados a "cel_individual[]"
CELULAS_INDIVIDUAIS ler_celulas_bms();

// Interpreta os dados de falhas/alertas vindos do BMS pra uma melhor manipulação dos mesmos
ALERTAS_BATERIA interpretador(byte resposta[13]);