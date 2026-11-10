#include "ADS.h"
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>


// =================== DEFINIÇÕES ===================

// A0 -> Sensor ±50 A
// A1 -> Sensor ±50 A
// A2 -> Sensor ±150 A
// A3 -> Referência de 2,5 V

Adafruit_ADS1115 ads;

static bool ads_disponivel = false;
static unsigned long ultima_tentativa_ads = 0;


// =================== CONFIGURAÇÃO ===================

const int NUM_LEITURAS = 20;

const double FATOR_50A  = 80.0;
const double FATOR_150A = 240.0;


// =================== OFFSET DE ZERO ===================

// ADS0 e ADS1: Sem corrente estavam lendo aproximadamente -5 A
// ADS2: Sem corrente estava lendo aproximadamente +9 A

const double OFFSET_ADS0 = 5.0;
const double OFFSET_ADS1 = 5.0;
const double OFFSET_ADS2 = -9.0;


// =================== CORREÇÃO DE GANHO ===================

const double GANHO_ADS0 = 0.9091;
const double GANHO_ADS1 = 0.9184;
const double GANHO_ADS2 = 0.9890;


// =================== INICIALIZAÇÃO ===================

void ADS_iniciar() {
    Wire.begin(SDA_ADS, SCL_ADS);
    Serial.println("Inicializando o ADS");
    ads_disponivel = ads.begin();
    ultima_tentativa_ads = millis();

    if (ads_disponivel) {
        ads.setGain(GAIN_ONE);
        Serial.println("ADS iniciado com sucesso!");

    } else {
        Serial.println(
            "ADS indisponível; a telemetria seguirá ativa e tentará novamente."
        );
    }
}


// =================== COLETA ===================

resposta_ADS ADS_coleta(bool ads0, bool ads1, bool ads2) {

    double soma0 = 0.0;
    double soma1 = 0.0;
    double soma2 = 0.0;

    double resultado0 = 0.0;
    double resultado1 = 0.0;
    double resultado2 = 0.0;


    // =================== VERIFICA ADS ===================

    if (!ads_disponivel) {

        if (millis() - ultima_tentativa_ads >= 5000) {
            ultima_tentativa_ads = millis();
            ads_disponivel = ads.begin();

            if (ads_disponivel) {
                ads.setGain(GAIN_ONE);
                Serial.println("ADS reconectado com sucesso!");
            }
        }

        if (!ads_disponivel) {
            return (resposta_ADS){-2, -2, -2};
        }
    }

    // ADS0: SENSOR ±50 A
    if (ads0) {

        for (int i = 0; i < NUM_LEITURAS; i++) {
            int16_t raw = ads.readADC_Differential_0_3();
            double tensao = ads.computeVolts(raw);
            soma0 += tensao;
        }

        // Média da tensão
        double tensao_media = soma0 / NUM_LEITURAS;

        // Tensão -> corrente
        resultado0 = tensao_media * FATOR_50A;

        // Corrige zero
        resultado0 += OFFSET_ADS0;

        // Corrige ganho
        resultado0 *= GANHO_ADS0;
    }

    // ADS1: SENSOR ±50 A

    if (ads1) {

        for (int i = 0; i < NUM_LEITURAS; i++) {
            int16_t raw = ads.readADC_Differential_1_3();
            double tensao = ads.computeVolts(raw);
            soma1 += tensao;
        }

        // Média da tensão
        double tensao_media = soma1 / NUM_LEITURAS;

        // Tensão -> corrente
        resultado1 = tensao_media * FATOR_50A;

        // Corrige zero
        resultado1 += OFFSET_ADS1;

        // Corrige ganho
        resultado1 *= GANHO_ADS1;
    }


    // ADS2: SENSOR ±150 A

    if (ads2) {

        for (int i = 0; i < NUM_LEITURAS; i++) {
            int16_t raw = ads.readADC_Differential_2_3();
            double tensao = ads.computeVolts(raw);
            soma2 += tensao;
        }

        // Média da tensão
        double tensao_media = soma2 / NUM_LEITURAS;

        // Tensão -> corrente
        resultado2 = tensao_media * FATOR_150A;

        // Corrige zero
        resultado2 += OFFSET_ADS2;

        // Corrige ganho
        resultado2 *= GANHO_ADS2;
    }

    return (resposta_ADS){resultado0, resultado1, resultado2};
}

// =================== VISUALIZAÇÃO ===================

void ADS_visualizar(resposta_ADS valores_ADS, bool ads0, bool ads1, bool ads2) {
    if (ads0) Serial.printf("ADS0: %.5f A\n", valores_ADS.ADS0);
    if (ads1) Serial.printf("ADS1: %.5f A\n", valores_ADS.ADS1);
    if (ads2) Serial.printf("ADS2: %.5f A\n", valores_ADS.ADS2);
}