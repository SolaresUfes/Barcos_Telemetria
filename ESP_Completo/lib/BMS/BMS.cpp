#include "BMS.h"
#include "Config.h"
#include <Arduino.h>


// ===================Definições==================

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


// ===============Funções auxiliares===============


DADOS_BATERIA ler_dados_bms() {

    byte resposta[64];
    int n = 0;

    DADOS_BATERIA dados;

    // Inicializa como inválido. Se algo der errado, não enviaremos lixo.
    dados.tensao = NAN;
    dados.corrente = NAN;
    dados.porcentagem = NAN;

    // Limpa qlqr byte antigo do buffer
    while (Serial2.available())
    {
        Serial2.read();
    }

    // Transmissão HIGH
    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(status_geral, sizeof(status_geral));
    Serial2.flush();

    Serial.println("Comando de dados enviado!");

    // Transmissão LOW
    digitalWrite(RS485_CONTROL, LOW);

    // Espera a resposta
    unsigned long inicio_leitura = millis();

    while (n < 64 && (millis() - inicio_leitura < 250))
    {
        if (Serial2.available())
            resposta[n++] = Serial2.read();
    }

    // Verifica o tamanho (13 bytes)
    if (n < 13)
    {
        Serial.print("Resposta incompleta! Bytes recebidos: ");
        Serial.println(n);

        return dados;
    }

    // Mostra a resposta no serial (pode ser ocultado, mas é bom pra fazer teste)
    Serial.print("Resposta BMS: ");

    for (int i = 0; i < n; i++)
    {
        Serial.printf("%02X ", resposta[i]);
    }

    Serial.println();

    // Verifica o Header da mensagem. Se nao for '0x45', a mensagem nao é valida, pois esse nao é o byte inicial da mensagem (provavelmente pode ser lixo ou algum tipo de interferencia)
    if (resposta[0] != 0xA5)
    {

        Serial.println("Pacote invalido: HEADER incorreto.");

        return dados;
    }

    // Verifica o comando da resposta
    if (resposta[2] != 0x90)
    {

        Serial.println("Pacote invalido: comando incorreto.");

        return dados;
    }

    // Interpreta os dados brutos
    uint16_t tensao_bruta = ((int)resposta[4] << 8) | resposta[5];
    uint16_t corrente_bruta = ((int)resposta[8] << 8) | resposta[9];
    uint16_t porcentagem_bruta = ((int)resposta[10] << 8) | resposta[11];

    // Converte para algo mais 'refinado'
    dados.tensao = tensao_bruta / 10.0;
    dados.corrente = (corrente_bruta - 30000) / 10.0;
    dados.porcentagem = porcentagem_bruta / 10.0;

    // Área para monitorar no vscode
    Serial.print("Tensao: ");
    Serial.println(dados.tensao);

    Serial.print("Corrente: ");
    Serial.println(dados.corrente);

    Serial.print("Porcentagem: ");
    Serial.println(dados.porcentagem);

    return dados;
}

ALERTAS_BATERIA ler_alertas_bms() {

    byte resposta[64];
    int n = 0;

    // Começa sem nenhum alerta
    ALERTAS_BATERIA alertas = {};

    // Limpa buffer
    while (Serial2.available())
    {
        Serial2.read();
    }

    // Transmissão HIGH
    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(falhas, sizeof(falhas));
    Serial2.flush();

    Serial.println("Comando de alertas enviado!");

    // Transmissão LOW
    digitalWrite(RS485_CONTROL, LOW);

    unsigned long inicio_leitura = millis();

    while (n < 64 && (millis() - inicio_leitura < 250))
    {
        if (Serial2.available())
            resposta[n++] = Serial2.read();
    }

    // Checagem de tamanho
    if (n < 13)
    {

        Serial.print("Resposta de alertas incompleta! Bytes: ");
        Serial.println(n);
        return alertas;
    }

    // Checagem de Header
    if (resposta[0] != 0xA5)
    {

        Serial.println("Resposta de alertas invalida: HEADER.");
        return alertas;
    }

    // Checagem de comando de resposta
    if (resposta[2] != 0x98)
    {
        Serial.println("Resposta de alertas invalida: comando.");
        return alertas;
    }

    // Interpreta a resposta (tem outra função pra isso)
    alertas = interpretador(resposta);

    return alertas;
}

CELULAS_INDIVIDUAIS ler_celulas_bms() {
    CELULAS_INDIVIDUAIS packs;

    // Inicializa as 16 células com zero
    for (int i = 0; i < 16; i++) packs.celulas[i] = 0.0;

    byte resposta[13];

    byte comando_celulas[] = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82};

    Serial2.write(comando_celulas, sizeof(comando_celulas));
    Serial2.flush();

    delay(10);

    digitalWrite(RS485_CONTROL, LOW);

    unsigned long inicio_leitura = millis();
    int frames_lidos = 0;

    while (frames_lidos < 6 && (millis() - inicio_leitura < 250)) {

        if (Serial2.available() >= 13) {
            int n = 0;

            while (n < 13) resposta[n++] = Serial2.read();

            if (resposta[0] == 0xA5 && resposta[2] == 0x95) {

                int frame = resposta[4];

                if (frame >= 1 && frame <= 6) {

                    int indice = (frame - 1) * 3;

                    if (indice < 16) {
                        packs.celulas[indice] =
                            ((resposta[5] << 8) | resposta[6]) / 1000.0;
                    }

                    if (indice + 1 < 16) {
                        packs.celulas[indice + 1] =
                            ((resposta[7] << 8) | resposta[8]) / 1000.0;
                    }

                    if (indice + 2 < 16) {
                        packs.celulas[indice + 2] =
                            ((resposta[9] << 8) | resposta[10]) / 1000.0;
                    }

                    frames_lidos++;
                }
            }
        }
    }

    return packs;
}

ALERTAS_BATERIA interpretador(byte resposta[13]) {

    byte alerta1 = resposta[4];
    byte alerta2 = resposta[5];

    // Inicializa todos os alertas dentro da struct como falsos
    ALERTAS_BATERIA alertas = {};

    if (alerta1 == 0 && alerta2 == 0)
    {
        Serial.println("Nenhum erro detectado!");
        Serial.println();
        return alertas;
    }

    // Erros nas celulas:
    alertas.celula_sobretensao = (alerta1 & (1 << 0)) != 0;
    alertas.celula_subtensao = (alerta1 & (1 << 1)) != 0;

    // Erros nos packs
    alertas.pack_sobretensao = (alerta1 & (1 << 2)) != 0;
    alertas.pack_subtensao = (alerta1 & (1 << 3)) != 0;

    // Erros de temperatura
    alertas.temp_carga_alta = (alerta1 & (1 << 4)) != 0;
    alertas.temp_carga_baixa = (alerta1 & (1 << 5)) != 0;
    alertas.temp_descarga_alta = (alerta1 & (1 << 6)) != 0;
    alertas.mosfet_temp_alta = (alerta1 & (1 << 7)) != 0;

    // Erros mais gerais
    alertas.corrente_carga_alta = (alerta2 & (1 << 0)) != 0;
    alertas.corrente_descarga_alta = (alerta2 & (1 << 1)) != 0;
    alertas.curto_circuito = (alerta2 & (1 << 2)) != 0;
    alertas.mosfet_travado = (alerta2 & (1 << 3)) != 0;

    alertas.alerta_ativo = (alertas.celula_sobretensao || alertas.celula_subtensao || alertas.corrente_carga_alta || alertas.corrente_descarga_alta || alertas.curto_circuito || alertas.mosfet_temp_alta || alertas.mosfet_travado || alertas.pack_sobretensao || alertas.pack_subtensao || alertas.temp_carga_alta || alertas.temp_carga_baixa || alertas.temp_descarga_alta);

    return alertas;
}

