#include "espnow.h"
#include "busca_canal.h"

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_timer.h>
#include <math.h>
#include <string.h>

#include "user_config.h"
#include "wifi_horario.h"

// A interrupção de recepção e o loop compartilham estes três valores.
static portMUX_TYPE trava_telemetria = portMUX_INITIALIZER_UNLOCKED;
static TelemetriaBarco ultima_telemetria = {};
static bool ha_telemetria_nova = false;
static uint8_t endereco_barco[6] = {};
static bool endereco_barco_recebido = false; // Só o loop usa esta marca.
static uint8_t destino_barco[6] = {}; // Só o loop usa este MAC.
static uint8_t canal_pacote_recebido = 0; // Diagnóstico, não condição de validade.
static uint32_t geracao_canal = 0;
static bool trocando_canal = false;
static uint32_t recebidos = 0, validos = 0, descartados = 0;
static int64_t inicio_canal_us = 0;
static bool radio_pronto = false;
static bool canal_definido = false;
static esp_err_t ultimo_erro_envio = ESP_OK;
static esp_err_t ultimo_erro_canal = ESP_OK;
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
  uint32_t geracao;
  portENTER_CRITICAL(&trava_telemetria);
  ++recebidos;
  geracao = geracao_canal;
  const bool trocando = trocando_canal;
  portEXIT_CRITICAL(&trava_telemetria);
  if (trocando || dados == nullptr || informacoes == nullptr ||
      quantidade != sizeof(PacoteTelemetriaEspNow)) return;

  PacoteTelemetriaEspNow pacote;
  memcpy(&pacote, dados, sizeof(pacote));
  if (!pacote_valido(pacote)) {
    return;
  }

  const int64_t instante_recebimento = esp_timer_get_time();
  // A seção crítica faz uma cópia completa sem o loop ler pela metade.
  portENTER_CRITICAL(&trava_telemetria);
  if (trocando_canal || geracao != geracao_canal) {
    ++descartados;
    portEXIT_CRITICAL(&trava_telemetria);
    return;
  }
  ++validos;
  ultima_telemetria.instante_recebimento_us = instante_recebimento;
  canal_pacote_recebido = informacoes->rx_ctrl ? informacoes->rx_ctrl->channel : 0;
  ultima_telemetria.sequencia = pacote.sequencia;
  ultima_telemetria.bateria_percentual = pacote.bateria_barco_percentual;
  ultima_telemetria.corrente_amperes = pacote.corrente_amperes;
  memcpy(endereco_barco, informacoes->src_addr, sizeof(endereco_barco));
  ha_telemetria_nova = true;
  portEXIT_CRITICAL(&trava_telemetria);
}

bool iniciar_espnow()
{
  if (radio_pronto) return true;
  // O modo estação é necessário para ESP-NOW, mas não implica conexão com
  // roteador. Usa o canal que o Wi-Fi encontrou antes de sincronizar o RTC.
  if (!WiFi.mode(WIFI_STA)) {
    Serial.println("ESP-NOW: falha ao ativar STA.");
    return false;
  }
  WiFi.disconnect(false, false);
  if (!canal_definido) {
    canal_atual_espnow = obter_canal_espnow();
    canal_definido = true;
  }
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

  radio_pronto = true;
  inicio_canal_us = esp_timer_get_time();
  Serial.printf("ESP-NOW aguardando telemetria por broadcast no canal %u.\n", canal_atual_espnow);
  return true;
}

bool procurar_proximo_canal_espnow()
{
  if (!radio_pronto) return false;
  wifi_country_t pais = {};
  esp_err_t resultado = esp_wifi_get_country(&pais);
  uint8_t proximo = canal_atual_espnow;
  if (resultado == ESP_OK && proximo_canal_permitido(canal_atual_espnow, pais.schan, pais.nchan, proximo)) {
    portENTER_CRITICAL(&trava_telemetria);
    trocando_canal = true;
    portEXIT_CRITICAL(&trava_telemetria);
    resultado = esp_wifi_set_channel(proximo, WIFI_SECOND_CHAN_NONE);
    portENTER_CRITICAL(&trava_telemetria);
    if (resultado == ESP_OK) {
      ++geracao_canal;
      ha_telemetria_nova = false;
    }
    trocando_canal = false;
    portEXIT_CRITICAL(&trava_telemetria);
  } else if (resultado == ESP_OK) {
    resultado = ESP_ERR_INVALID_ARG;
  }
  if (resultado != ESP_OK) {
    if (resultado != ultimo_erro_canal) {
      Serial.printf("ESP-NOW: falha na troca de canal (%s).\n", esp_err_to_name(resultado));
    }
    ultimo_erro_canal = resultado;
    return false;
  }
  ultimo_erro_canal = ESP_OK;
  canal_atual_espnow = proximo;
  inicio_canal_us = esp_timer_get_time();
  // Qualquer pacote anterior à mudança é descartado ao consumir, usando
  // instante/canal registrados no callback; não pode cancelar a nova busca.
  Serial.printf("ESP-NOW: procurando no canal %u.\n", canal_atual_espnow);
  return true;
}

bool solicitar_telemetria(bool descoberta)
{
  if (!radio_pronto) return false;
  PacotePedidoTelemetriaEspNow pedido = {};
  pedido.assinatura = ASSINATURA_PEDIDO_TELEMETRIA;
  pedido.versao = VERSAO_PACOTE_TELEMETRIA;
  pedido.tamanho = sizeof(PacotePedidoTelemetriaEspNow);
  pedido.sequencia = proxima_solicitacao++;

  const uint8_t *destino = destino_unicast_pronto && !descoberta
    ? destino_barco
    : ENDERECO_BROADCAST;

  const esp_err_t resultado = esp_now_send(
    destino,
    reinterpret_cast<const uint8_t *>(&pedido),
    sizeof(pedido)
  );
  if (resultado != ESP_OK && resultado != ultimo_erro_envio) {
    Serial.printf("ESP-NOW: consulta nao aceita (%s).\n", esp_err_to_name(resultado));
  }
  ultimo_erro_envio = resultado;
  return resultado == ESP_OK;
}

bool solicitar_reinicio_remoto()
{
  if (!radio_pronto) return false;
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
  uint8_t mac[6];
  portENTER_CRITICAL(&trava_telemetria);
  disponivel = ha_telemetria_nova && ultima_telemetria.instante_recebimento_us >= inicio_canal_us;
  if (ha_telemetria_nova && !disponivel) ++descartados;
  if (disponivel) {
    telemetria = ultima_telemetria;
    memcpy(mac, endereco_barco, 6);
  }
  ha_telemetria_nova = false;
  portEXIT_CRITICAL(&trava_telemetria);

  if (disponivel) {
    uint8_t real = 0;
    wifi_second_chan_t secundario;
    if (esp_wifi_get_channel(&real, &secundario) == ESP_OK) canal_atual_espnow = real;
  }
  // O MAC confirmado é cópia exclusiva do loop: callback não modifica
  // destino enquanto um pedido está sendo preparado/enviado.
  if (disponivel && (!endereco_barco_recebido || memcmp(destino_barco, mac, 6) != 0)) {
    memcpy(destino_barco, mac, 6);
    endereco_barco_recebido = true;
    destino_unicast_pronto = false;
  }
  if (disponivel && endereco_barco_recebido && !destino_unicast_pronto) {
    esp_now_peer_info_t barco = {};
    memcpy(barco.peer_addr, destino_barco, 6);
    barco.channel = 0;
    barco.ifidx = WIFI_IF_STA;
    destino_unicast_pronto = esp_now_is_peer_exist(destino_barco) ||
      esp_now_add_peer(&barco) == ESP_OK;
    if (destino_unicast_pronto) Serial.println("ESP-NOW: destino direto confirmado.");
    else Serial.println("ESP-NOW: falha no peer direto; usando broadcast.");
  }
  return disponivel;
}

void diagnosticar_espnow()
{
  uint32_t rx, ok, descartes;
  uint8_t metadado;
  portENTER_CRITICAL(&trava_telemetria);
  rx = recebidos; ok = validos; descartes = descartados;
  metadado = canal_pacote_recebido;
  portEXIT_CRITICAL(&trava_telemetria);
  uint8_t real = 0;
  wifi_second_chan_t secundario;
  const esp_err_t resultado = esp_wifi_get_channel(&real, &secundario);
  Serial.printf("RADIO: pronto=%u salvo=%u real=%u canalAPI=%s envio=%s RX=%lu validos=%lu descartes=%lu metadata=%u.\n",
    radio_pronto, canal_atual_espnow, real, esp_err_to_name(resultado), esp_err_to_name(ultimo_erro_envio),
    (unsigned long)rx, (unsigned long)ok, (unsigned long)descartes, metadado);
}
