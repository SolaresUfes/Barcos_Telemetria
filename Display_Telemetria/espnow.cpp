#include "espnow.h"

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <math.h>
#include <string.h>

#include "user_config.h"

// A interrupção de recepção e o loop compartilham estes três valores.
static portMUX_TYPE trava_telemetria = portMUX_INITIALIZER_UNLOCKED;
static TelemetriaBarco ultima_telemetria = {};
static bool ha_telemetria_nova = false;
static uint32_t proxima_solicitacao = 0;
static const uint8_t ENDERECO_BROADCAST[6] = {
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
};

// Rejeita pacotes quebrados antes que qualquer valor chegue à interface.
static bool pacote_valido(const PacoteTelemetriaEspNow &pacote)
{
  return pacote.versao == VERSAO_PACOTE_TELEMETRIA &&
         pacote.tamanho == sizeof(PacoteTelemetriaEspNow) &&
         isfinite(pacote.bateria_barco_percentual) &&
         pacote.bateria_barco_percentual >= 0.0f &&
         pacote.bateria_barco_percentual <= 100.0f &&
         isfinite(pacote.corrente_amperes) &&
         fabsf(pacote.corrente_amperes) <= 10000.0f;
}

// Esta função é chamada pelo sistema de rádio quando chega uma mensagem.
static void receber_pacote(const esp_now_recv_info_t *, const uint8_t *dados, int quantidade)
{
  if (quantidade != sizeof(PacoteTelemetriaEspNow)) {
    return;
  }

  PacoteTelemetriaEspNow pacote;
  memcpy(&pacote, dados, sizeof(pacote));
  if (!pacote_valido(pacote)) {
    return;
  }

  // A seção crítica faz uma cópia completa sem o loop ler pela metade.
  portENTER_CRITICAL(&trava_telemetria);
  ultima_telemetria.sequencia = pacote.sequencia;
  ultima_telemetria.bateria_percentual = pacote.bateria_barco_percentual;
  ultima_telemetria.corrente_amperes = pacote.corrente_amperes;
  ha_telemetria_nova = true;
  portEXIT_CRITICAL(&trava_telemetria);
}

bool iniciar_espnow()
{
  // O modo estação é necessário para ESP-NOW, mas não implica conexão com
  // roteador. O canal fixo precisa ser igual ao usado pelo transmissor.
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(false, false);
  if (esp_wifi_set_channel(ESPNOW_CHANNEL, WIFI_SECOND_CHAN_NONE) != ESP_OK) {
    Serial.println("Falha ao selecionar o canal fixo do ESP-NOW.");
    return false;
  }
  if (esp_now_init() != ESP_OK) {
    Serial.println("Falha ao iniciar ESP-NOW.");
    return false;
  }
  if (esp_now_register_recv_cb(receber_pacote) != ESP_OK) {
    Serial.println("Falha ao registrar o recebimento ESP-NOW.");
    esp_now_deinit();
    return false;
  }

  // O pedido é transmitido em broadcast, sem depender do MAC da outra ESP.
  esp_now_peer_info_t transmissor = {};
  memcpy(transmissor.peer_addr, ENDERECO_BROADCAST, sizeof(ENDERECO_BROADCAST));
  transmissor.channel = ESPNOW_CHANNEL;
  transmissor.ifidx = WIFI_IF_STA;
  transmissor.encrypt = false;
  if (!esp_now_is_peer_exist(ENDERECO_BROADCAST) &&
      esp_now_add_peer(&transmissor) != ESP_OK) {
    Serial.println("Falha ao cadastrar broadcast do ESP-NOW.");
    esp_now_deinit();
    return false;
  }

  Serial.printf("ESP-NOW aguardando telemetria no canal fixo %d.\n", ESPNOW_CHANNEL);
  return true;
}

bool solicitar_telemetria()
{
  PacotePedidoTelemetriaEspNow pedido = {};
  pedido.assinatura = ASSINATURA_PEDIDO_TELEMETRIA;
  pedido.versao = VERSAO_PACOTE_TELEMETRIA;
  pedido.tamanho = sizeof(PacotePedidoTelemetriaEspNow);
  pedido.sequencia = proxima_solicitacao++;

  return esp_now_send(
    ENDERECO_BROADCAST,
    reinterpret_cast<const uint8_t *>(&pedido),
    sizeof(pedido)
  ) == ESP_OK;
}

bool obter_nova_telemetria(TelemetriaBarco &telemetria)
{
  // A marca de novidade é consumida depois que o pacote é copiado.
  bool disponivel;
  portENTER_CRITICAL(&trava_telemetria);
  disponivel = ha_telemetria_nova;
  if (disponivel) {
    telemetria = ultima_telemetria;
    ha_telemetria_nova = false;
  }
  portEXIT_CRITICAL(&trava_telemetria);
  return disponivel;
}
