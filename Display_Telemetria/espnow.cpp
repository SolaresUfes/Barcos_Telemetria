#include "espnow.h"

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <math.h>
#include <string.h>

// A interrupção de recepção e o loop compartilham estes três valores.
static portMUX_TYPE trava_telemetria = portMUX_INITIALIZER_UNLOCKED;
static TelemetriaBarco ultima_telemetria = {};
static bool ha_telemetria_nova = false;

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
  // O modo estação é compartilhado com a conexão usada para o NTP.
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("Falha ao iniciar ESP-NOW.");
    return false;
  }
  if (esp_now_register_recv_cb(receber_pacote) != ESP_OK) {
    Serial.println("Falha ao registrar o recebimento ESP-NOW.");
    esp_now_deinit();
    return false;
  }

  Serial.printf("ESP-NOW aguardando telemetria no canal Wi-Fi %d.\n", WiFi.channel());
  return true;
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
