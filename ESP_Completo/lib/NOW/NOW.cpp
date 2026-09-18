#include "NOW.h"

#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <math.h>
#include <string.h>

#if __has_include(<esp_arduino_version.h>)
#include <esp_arduino_version.h>
#endif

// O broadcast dispensa cadastrar previamente o endereço MAC do display.
static const uint8_t ENDERECO_BROADCAST[6] = {
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
};

// A interrupção do rádio e o loop principal compartilham a última leitura.
static portMUX_TYPE trava_dados = portMUX_INITIALIZER_UNLOCKED;
static DADOS_BATERIA ultimos_dados = {NAN, NAN, NAN};
static bool ha_dados_validos = false;
static uint32_t proxima_sequencia = 0;
static volatile bool reinicio_pendente = false;
static bool espnow_pronto = false;

// Confere se a leitura do BMS pode ser mostrada sem enviar lixo ao display.
static bool dados_validos(const DADOS_BATERIA &dados) {
    return isfinite(dados.porcentagem) &&
           dados.porcentagem >= 0.0f &&
           dados.porcentagem <= 100.0f &&
           isfinite(dados.corrente);
}

void NOW_atualizar_dados(const DADOS_BATERIA &dados) {
    if (!dados_validos(dados)) {
        return;
    }

    portENTER_CRITICAL(&trava_dados);
    ultimos_dados = dados;
    ha_dados_validos = true;
    portEXIT_CRITICAL(&trava_dados);
}

// Responde imediatamente ao pedido usando a última leitura completa do BMS.
static void enviar_telemetria() {
    DADOS_BATERIA dados;
    bool disponivel;

    portENTER_CRITICAL(&trava_dados);
    dados = ultimos_dados;
    disponivel = ha_dados_validos;
    portEXIT_CRITICAL(&trava_dados);

    // Antes da primeira leitura válida, não responde. Assim o círculo ou o X
    // informa corretamente que ainda não existe telemetria disponível.
    if (!disponivel) {
        return;
    }

    PacoteTelemetriaEspNow pacote = {};
    pacote.versao = VERSAO_PACOTE_TELEMETRIA;
    pacote.tamanho = sizeof(PacoteTelemetriaEspNow);
    pacote.sequencia = proxima_sequencia++;
    pacote.bateria_barco_percentual = dados.porcentagem;
    pacote.corrente_amperes = dados.corrente;

    const esp_err_t resultado = esp_now_send(
        ENDERECO_BROADCAST,
        reinterpret_cast<const uint8_t *>(&pacote),
        sizeof(pacote)
    );

    if (resultado != ESP_OK) {
        Serial.printf("ESP-NOW: falha ao responder telemetria: %d.\n", resultado);
    }
}

// Valida o conteúdo recebido antes de executar qualquer ação.
static void processar_pacote_recebido(const uint8_t *dados, int tamanho) {
    if (tamanho == static_cast<int>(sizeof(PacotePedidoTelemetriaEspNow))) {
        PacotePedidoTelemetriaEspNow pedido;
        memcpy(&pedido, dados, sizeof(pedido));

        if (pedido.assinatura == ASSINATURA_PEDIDO_TELEMETRIA &&
            pedido.versao == VERSAO_PACOTE_TELEMETRIA &&
            pedido.tamanho == sizeof(PacotePedidoTelemetriaEspNow)) {
            enviar_telemetria();
        }
        return;
    }

    if (tamanho == static_cast<int>(sizeof(PacoteReinicioRemotoEspNow))) {
        PacoteReinicioRemotoEspNow comando;
        memcpy(&comando, dados, sizeof(comando));

        if (comando.assinatura == ASSINATURA_REINICIO_REMOTO &&
            comando.versao == VERSAO_PACOTE_TELEMETRIA &&
            comando.tamanho == sizeof(PacoteReinicioRemotoEspNow) &&
            comando.chave == CHAVE_REINICIO_REMOTO) {
            // Não exige confirmação de volta. Basta uma das três cópias chegar.
            reinicio_pendente = true;
        }
    }
}

// A assinatura da função mudou entre as versões 2 e 3 do Arduino ESP32.
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
static void receber_pacote(
    const esp_now_recv_info_t *,
    const uint8_t *dados,
    int tamanho
) {
    processar_pacote_recebido(dados, tamanho);
}
#else
static void receber_pacote(
    const uint8_t *,
    const uint8_t *dados,
    int tamanho
) {
    processar_pacote_recebido(dados, tamanho);
}
#endif

// Uma tarefa própria permite reiniciar mesmo se o envio HTTP estiver lento.
static void tarefa_reinicio(void *) {
    for (;;) {
        if (reinicio_pendente) {
            Serial.println("ESP-NOW: reinicio remoto recebido.");
            Serial.flush();
            delay(120);
            ESP.restart();
        }
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

bool NOW_iniciar() {
    if (espnow_pronto) {
        return true;
    }

    // A ESP continua ligada ao roteador. O ESP-NOW compartilha o canal atual.
    WiFi.mode(WIFI_STA);
    const uint8_t canal_atual = WiFi.channel();

    if (esp_now_init() != ESP_OK) {
        Serial.println("ESP-NOW: falha ao iniciar.");
        return false;
    }

    if (esp_now_register_recv_cb(receber_pacote) != ESP_OK) {
        Serial.println("ESP-NOW: falha ao registrar o recebimento.");
        esp_now_deinit();
        return false;
    }

    esp_now_peer_info_t destino = {};
    memcpy(destino.peer_addr, ENDERECO_BROADCAST, sizeof(ENDERECO_BROADCAST));
    // Canal zero acompanha o canal atual do rádio, inclusive após reconexão.
    destino.channel = 0;
    destino.ifidx = WIFI_IF_STA;
    destino.encrypt = false;

    if (!esp_now_is_peer_exist(ENDERECO_BROADCAST) &&
        esp_now_add_peer(&destino) != ESP_OK) {
        Serial.println("ESP-NOW: falha ao cadastrar o broadcast.");
        esp_now_deinit();
        return false;
    }

    if (xTaskCreate(tarefa_reinicio, "reinicio-remoto", 2048, nullptr, 3, nullptr) != pdPASS) {
        Serial.println("ESP-NOW: falha ao criar a tarefa de reinicio.");
        esp_now_deinit();
        return false;
    }

    espnow_pronto = true;
    Serial.printf("ESP-NOW pronto no canal Wi-Fi %u.\n", canal_atual);
    return true;
}
