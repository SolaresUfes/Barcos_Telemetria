#pragma once

#include <Arduino.h>
#include "Estruturas.h"


/* --- DEFINIÇÕES --- */

// Comando geral que pode ser usado para tensao, corrente e porcentagem
byte status_geral[]   = {0xA5, 0x40, 0x90, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7D}; // 381 -> 125 = 0x7D
// Comando para recebimento dos valores individuais de tensao por pack de bateria (32 packs)
byte cel_individual[] = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82};
// Comando pra recebimentos das falhas/alertas do BMS
byte falhas[]         = {0xA5, 0x40, 0x98, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85}; // 389 -> 133 = 0x85

// Comandos usam uma sequencia definida como:
/*
  [0] 0xA5   → Iniciador
  [1] 0x40   → Endereço de quem esta sendo acessado (O Daly pode ser um pouco diferente, como: 0x01, 0x40 ou 0x80)
  [2] CMD    → Comando
  [3] 0x08   → Tamanho da mensagem. Nesse caso, temos uma mensagem com tamanho 8
  [4] 0x00
  [5] 0x00
  [6] 0x00
  [7] Checksum -> (byte0 + byte1 + ... + byte6) & 0xFF -> Descarta quaisquer informaçoes acima de 255...
*/

// A resposta vem com 13 bytes e seu processamento pode ser feito nas funcoes especificas:
/*
  0    Start
  1    Address
  2    Command
  3    Length
  4    Data1
  ...
  11   Data8
  12   Checksum

  Cada resposta de uma "pergunta" vem com 2 bytes de informacao, logo, a resposta pra um comando tera que ser computada no formato:

  int resposta_pra_algo = (array_resposta[n] << 8) | array_resposta[n+1];
  
  Onde o n sera o byte que queremos analisar. Para cada comando, o byte pode mudar, entao o codigo nao tem somente um valor pra "n"
*/


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