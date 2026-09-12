#include "Config.h"

#include "NET.h"
#include "ADS.h"
#include "BMS.h"

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
    iniciar_BMS();

    // Inicia o ADS e o barramento I2C
    iniciar_ADS();

    // Conecta Wi-Fi
    conectar_wifi();
}

// ----------------- LOOP -----------------

void loop() {
    unsigned long tempo_atual = millis();

    // Executa a leitura a cada intervalo_leitura
    if (tempo_atual - tempo_anterior >= intervalo_leitura) {

        tempo_anterior = tempo_atual;

        // leitura dos dados gerais
        DADOS_BATERIA BMS_dados = ler_dados_bms();
        enviar_dados_bateria(BMS_dados);

        // Alertas
        ALERTAS_BATERIA BMS_alertas = ler_alertas_bms();
        enviar_alertas_bateria(BMS_alertas);

        // Células
        CELULAS_INDIVIDUAIS BMS_celulas = ler_celulas_bms();
        enviar_dados_celulas(BMS_celulas);

        resposta_ADS resposta_ads = coleta_ADS(true, true, true, true);
        visualizar_ADS(resposta_ads, true, true, true);
    }
}
