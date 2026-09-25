#include "Config.h"

#include <WiFi.h>

#include "NET.h"
#include "ADS.h"
#include "BMS.h"
#include "NOW.h"

// #include "Teste.h"


// ----------------- VARIAVEIS E CONSTANTES -----------------

// Variaveis de controle de tempo para substituir o delay no loop -> ADICIONADO
unsigned long tempo_anterior = 0;
const unsigned long intervalo_leitura = 2000;

// ----------------- SETUP -----------------

void setup() {

    // Inicio do serial do monitor
    Serial.begin(BAUD_SERIAL);

    // Inicia o BMS e as coisas relacionadas a comunicação pemo MAX485
    BMS_iniciar();

    // Inicia o ADS e o barramento I2C
    ADS_iniciar();

    // Conecta Wi-Fi
    NET_conectar_wifi();

    // O ESP-NOW compartilha o canal da conexão Wi-Fi e aguarda o display.
    NOW_iniciar();

    WiFi.mode(WIFI_STA);
    delay(100);

    Serial.print("MAC: ");
    Serial.println(WiFi.macAddress());    
}

// ----------------- LOOP -----------------

void loop() {
    unsigned long tempo_atual = millis();

    // Executa a leitura a cada intervalo_leitura
    if (tempo_atual - tempo_anterior >= intervalo_leitura) {

        tempo_anterior = tempo_atual;

        // leitura dos dados gerais
        DADOS_BATERIA BMS_dados = BMS_ler_dados();
        NOW_atualizar_dados(BMS_dados);

        resposta_ADS resposta_ads = ADS_coleta(true, true, true, true);
        ADS_visualizar(resposta_ads, true, true, true);

        NET_enviar_dados(BMS_dados, resposta_ads);

        // Alertas
        ALERTAS_BATERIA BMS_alertas = BMS_ler_alertas();
        NET_enviar_alertas_bateria(BMS_alertas);

        // Células
        CELULAS_INDIVIDUAIS BMS_celulas = BMS_ler_celulas();
        NET_enviar_dados_celulas(BMS_celulas);

    }
}
