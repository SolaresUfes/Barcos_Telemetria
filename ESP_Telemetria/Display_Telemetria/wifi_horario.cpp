#include "wifi_horario.h"

#include <Arduino.h>
#include <WiFi.h>
#include <esp_wifi.h>
#include <time.h>
#include <esp_sntp.h>

#include "configuracao_wifi.h"
#include "src/i2c_bsp.h"
#include "src/i2c_equipment.h"
#include "user_config.h"

// Os limites impedem que a inicialização fique presa indefinidamente.
static constexpr uint32_t TEMPO_LIMITE_WIFI_MS = 20000;
static constexpr uint32_t TEMPO_LIMITE_NTP_MS = 5000;
static constexpr uint32_t INTERVALO_NOVA_TENTATIVA_MS = 5000;
static constexpr char FUSO_SAO_PAULO[] = "BRT3";

// O objeto usa a mesma API do exemplo oficial da Waveshare.
static i2c_equipment *rtc = nullptr;
static bool horario_foi_sincronizado = false;
static uint32_t instante_ultima_tentativa = 0;
static uint8_t canal_espnow = ESPNOW_CHANNEL;

// Tenta obter a hora da internet e gravá-la no RTC, sem reiniciar a placa.
static bool sincronizar_rtc_pela_internet()
{
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  configTzTime(FUSO_SAO_PAULO, "pool.ntp.org", "time.google.com");
  struct tm horario_ntp = {};
  if (!getLocalTime(&horario_ntp, TEMPO_LIMITE_NTP_MS)) {
    Serial.println("NTP indisponível; mantendo o horário existente no RTC.");
    return false;
  }

  rtc->set_rtcTime(
    horario_ntp.tm_year + 1900,
    horario_ntp.tm_mon + 1,
    horario_ntp.tm_mday,
    horario_ntp.tm_hour,
    horario_ntp.tm_min,
    horario_ntp.tm_sec
  );

  // O driver não retorna o resultado da escrita: confirma por leitura.
  const RtcDateTime_t gravado = rtc->get_rtcTime();
  struct tm horario_rtc = {};
  horario_rtc.tm_year = gravado.year - 1900;
  horario_rtc.tm_mon = gravado.month - 1;
  horario_rtc.tm_mday = gravado.day;
  horario_rtc.tm_hour = gravado.hour;
  horario_rtc.tm_min = gravado.minute;
  horario_rtc.tm_sec = gravado.second;
  horario_rtc.tm_isdst = -1;
  const double diferenca = difftime(mktime(&horario_rtc), mktime(&horario_ntp));
  if (gravado.month < 1 || gravado.month > 12 || gravado.day < 1 ||
      gravado.day > 31 || gravado.hour > 23 || gravado.minute > 59 ||
      gravado.second > 59 || diferenca < 0 || diferenca > 2) {
    Serial.println("RTC não confirmou a hora gravada; mantendo novas tentativas.");
    return false;
  }

  horario_foi_sincronizado = true;

  // Guarda o canal antes de sair do roteador. A ESP do barco continua ligada
  // à mesma rede, portanto o ESP-NOW precisa permanecer neste canal.
  canal_espnow = WiFi.channel();

  // Após sincronizar, encerra NTP e qualquer reconexão até o próximo boot.
  // O rádio permanece em STA para o ESP-NOW.
  esp_sntp_stop();
  if (!WiFi.setAutoReconnect(false)) {
    Serial.println("Falha ao desativar a reconexão Wi-Fi.");
  }
  if (!WiFi.disconnect(false, false)) {
    Serial.println("Falha ao encerrar a associação Wi-Fi.");
  }
  delay(50);
  esp_wifi_set_channel(canal_espnow, WIFI_SECOND_CHAN_NONE);

  Serial.printf(
    "RTC sincronizado. Roteador desconectado; ESP-NOW mantido no canal %u.\n",
    canal_espnow
  );
  return true;
}

// Aguarda a associação com o roteador somente até o tempo limite.
static bool conectar_wifi()
{
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_SENHA);

  const uint32_t inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < TEMPO_LIMITE_WIFI_MS) {
    delay(250);
  }
  if (WiFi.status() == WL_CONNECTED) {
    canal_espnow = WiFi.channel();
    return true;
  }
  return false;
}

uint8_t obter_canal_espnow()
{
  return canal_espnow;
}

void inicializar_wifi_e_horario()
{
  // O barramento I2C é aberto mesmo sem Wi-Fi, pois o RTC continua funcionando.
  i2c_master_Init();
  rtc = new i2c_equipment();

  // Placeholders não provocam um ciclo infinito de reinicializações.
  if (!WIFI_CONFIGURADO) {
    Serial.println("Wi-Fi não configurado; mantendo o horário existente no RTC.");
    WiFi.mode(WIFI_STA);
    return;
  }

  if (!conectar_wifi()) {
    Serial.println("Wi-Fi indisponível; seguindo com o RTC e tentando novamente depois.");
    return;
  }

  sincronizar_rtc_pela_internet();
}

void processar_wifi_e_horario()
{
  if (!WIFI_CONFIGURADO || horario_foi_sincronizado || rtc == nullptr) {
    return;
  }

  const uint32_t agora = millis();
  if (agora - instante_ultima_tentativa < INTERVALO_NOVA_TENTATIVA_MS) {
    return;
  }

  instante_ultima_tentativa = agora;

  // A pilha do Wi-Fi continua procurando o roteador automaticamente.
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  sincronizar_rtc_pela_internet();
}

HorarioRtc ler_horario_rtc()
{
  // Um retorno zerado protege chamadas feitas antes da inicialização.
  if (rtc == nullptr) {
    return {};
  }

  // Converte o tipo do driver para o tipo simples usado pela aplicação.
  const RtcDateTime_t valor = rtc->get_rtcTime();
  return {
    valor.year,
    valor.month,
    valor.day,
    valor.hour,
    valor.minute,
    valor.second
  };
}
