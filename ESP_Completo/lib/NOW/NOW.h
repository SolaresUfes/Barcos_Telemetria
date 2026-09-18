#pragma once

#include <Arduino.h>

#include "Estruturas.h"

// O display e a ESP do barco precisam usar exatamente estes mesmos valores.
constexpr uint16_t VERSAO_PACOTE_TELEMETRIA = 1;
constexpr uint32_t ASSINATURA_PEDIDO_TELEMETRIA = 0x534F4C52;
constexpr uint32_t ASSINATURA_REINICIO_REMOTO = 0x52535452;
constexpr uint32_t CHAVE_REINICIO_REMOTO = 0xA57C31E2;

// O display envia este pacote uma vez por segundo para pedir os dados atuais.
struct __attribute__((packed)) PacotePedidoTelemetriaEspNow {
    uint32_t assinatura;
    uint16_t versao;
    uint16_t tamanho;
    uint32_t sequencia;
};

// O botÃ£o esquerdo do display envia este comando trÃªs vezes por seguranÃ§a.
struct __attribute__((packed)) PacoteReinicioRemotoEspNow {
    uint32_t assinatura;
    uint16_t versao;
    uint16_t tamanho;
    uint32_t sequencia;
    uint32_t chave;
};

// Inicia o receptor ESP-NOW no mesmo canal usado pela conexÃ£o Wi-Fi.
bool NOW_iniciar();

// Guarda a leitura mais recente do BMS para responder rapidamente ao display.
void NOW_atualizar_dados(const DADOS_BATERIA &dados);
