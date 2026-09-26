#include "espnow.h"

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <math.h>
#include <string.h>

#include "user_config.h"
#include "wifi_horario.h"

// A interrupção de recepção e o loop compartilham estes três valores.
static portMUX_TYPE trava_telemetria = portMUX_INITIALIZER_UNLOCKED;
static TelemetriaBarco ultima_telemetria = {};
static bool ha_telemetria_nova = false;
static uint8_t endereco_barco[6] = {};
static bool endereco_barco_recebido = false;
static bool destino_unicast_pronto = false;
static uint32_t proxima_solicitacao = 0;
static uint32_t proximo_reinicio = 0;
static uint8_t canal_atual_espnow = 1;
static const uint8_t ENDERECO_BROADCAST[6] = {
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
};

// Rejeita pacotes quebrados antes que qualquer valor chegue à interface.
static bool pacote_valido(const PacoteTelemetriaEspNow &pacote)
{
  return pacote.versao == VERSAO_PACOTE_TELEMETRIA &&
         pacote.tamanho == sizeof(PacoteTelemetriaEspNow) &&
         isfinite(pacote.bateria_barco_percentual) &&
         pacote.bateria_barco_percentual >= -2.0f &&
         pacote.bateria_barco_percentual <= 100.0f &&
         isfinite(pacote.corrente_amperes) &&
         fabsf(pacote.corrente_amperes) <= 10000.0f;
}

// Esta função é chamada pelo sistema de rádio quando chega uma mensagem.
static void receber_pacote(const esp_now_recv_info_t *informacoes, const uint8_t *dados, int quantidade)
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
  if (informacoes != nullptr) {
    memcpy(endereco_barco, informacoes->src_addr, sizeof(endereco_barco));
    endereco_barco_recebido = true;
  }
  ha_telemetria_nova = true;
  portEXIT_CRITICAL(&trava_telemetria);
}

bool iniciar_espnow()
{
  // O modo estação é necessário para ESP-NOW, mas não implica conexão com
  // roteador. Usa o canal que o Wi-Fi encontrou antes de sincronizar o RTC.
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(false, false);
  canal_atual_espnow = obter_canal_espnow();
  if (esp_wifi_set_channel(canal_atual_espnow, WIFI_SECOND_CHAN_NONE) != ESP_OK) {
    Serial.println("Falha ao selecionar o canal do ESP-NOW.");
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
  transmissor.channel = 0;
  transmissor.ifidx = WIFI_IF_STA;
  transmissor.encrypt = false;
  if (!esp_now_is_peer_exist(ENDERECO_BROADCAST) &&
      esp_now_add_peer(&transmissor) != ESP_OK) {
    Serial.println("Falha ao cadastrar broadcast do ESP-NOW.");
    esp_now_deinit();
    return false;
  }

  Serial.printf("ESP-NOW aguardando telemetria por broadcast no canal %u.\n", canal_atual_espnow);
  return true;
}

void procurar_proximo_canal_espnow()
{
  // Os canais de 1 a 13 cobrem as redes Wi-Fi de 2,4 GHz usadas no Brasil.
  canal_atual_espnow = canal_atual_espnow >= 13 ? 1 : canal_atual_espnow + 1;
  if (esp_wifi_set_channel(canal_atual_espnow, WIFI_SECOND_CHAN_NONE) == ESP_OK) {
    Serial.printf("ESP-NOW procurando a ESP do barco no canal %u.\n", canal_atual_espnow);
  } else {
    Serial.printf("ESP-NOW nao conseguiu selecionar o canal %u.\n", canal_atual_espnow);
  }
}

bool solicitar_telemetria()
{
  PacotePedidoTelemetriaEspNow pedido = {};
  pedido.assinatura = ASSINATURA_PEDIDO_TELEMETRIA;
  pedido.versao = VERSAO_PACOTE_TELEMETRIA;
  pedido.tamanho = sizeof(PacotePedidoTelemetriaEspNow);
  pedido.sequencia = proxima_solicitacao++;

  const uint8_t *destino = destino_unicast_pronto
    ? endereco_barco
    : ENDERECO_BROADCAST;

  return esp_now_send(
    destino,
    reinterpret_cast<const uint8_t *>(&pedido),
    sizeof(pedido)
  ) == ESP_OK;
}

bool solicitar_reinicio_remoto()
{
  PacoteReinicioRemotoEspNow comando = {};
  comando.assinatura = ASSINATURA_REINICIO_REMOTO;
  comando.versao = VERSAO_PACOTE_TELEMETRIA;
  comando.tamanho = sizeof(PacoteReinicioRemotoEspNow);
  comando.sequencia = proximo_reinicio++;
  comando.chave = CHAVE_REINICIO_REMOTO;

  bool algum_envio_aceito = false;
  for (uint8_t tentativa = 0; tentativa < 3; ++tentativa) {
    const esp_err_t resultado = esp_now_send(
      ENDERECO_BROADCAST,
      reinterpret_cast<const uint8_t *>(&comando),
      sizeof(comando)
    );
    algum_envio_aceito = algum_envio_aceito || resultado == ESP_OK;
    delay(30);
  }
  return algum_envio_aceito;
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

  // Depois da descoberta por broadcast, cadastra a ESP do barco e passa a
  // fazer os próximos pedidos diretamente para ela.
  if (disponivel && endereco_barco_recebido && !destino_unicast_pronto) {
    esp_now_peer_info_t barco = {};
    memcpy(barco.peer_addr, endereco_barco, sizeof(endereco_barco));
    barco.channel = 0;
    barco.ifidx = WIFI_IF_STA;
    barco.encrypt = false;
    destino_unicast_pronto = esp_now_is_peer_exist(endereco_barco) ||
      esp_now_add_peer(&barco) == ESP_OK;
    if (destino_unicast_pronto) {
      Serial.println("ESP-NOW: comunicação direta com a ESP do barco ativada.");
    }
  }
  return disponivel;
}
