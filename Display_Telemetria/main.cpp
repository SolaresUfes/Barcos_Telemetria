#include <Arduino.h>

#include "bateria.h"
#include "espnow.h"
#include "led_status.h"
#include "tela.h"
#include "wifi_horario.h"

// Guarda o minuto já processado para sincronizar relógio e bateria do display.
static uint8_t ultimo_minuto_da_bateria = 255;

// Transfere para a tela o pacote mais recente recebido por ESP-NOW.
static void receber_telemetria()
{
  TelemetriaBarco telemetria;
  if (obter_nova_telemetria(telemetria)) {
    agendar_telemetria_na_tela(
      telemetria.bateria_percentual,
      telemetria.corrente_amperes
    );
  }
}

// Lê a bateria quando solicitado e atualiza a interface.
static void atualizar_bateria_do_display()
{
  uint8_t percentual;
  if (obter_percentual_bateria(percentual)) {
    atualizar_bateria_display_na_tela(percentual);

    if (percentual == 0) {
      Serial.println("Bateria em 0%; solicitando desligamento imediato.");
      solicitar_desligamento();
    }
  }
}

// Atualiza o relógio e mede a bateria exatamente quando o minuto muda.
static void atualizar_relogio_e_bateria()
{
  const HorarioRtc horario = ler_horario_rtc();
  atualizar_horario_na_tela(horario.hora, horario.minuto);

  if (horario.hora > 23 || horario.minuto > 59) {
    return;
  }

  // A primeira chamada apenas alinha o minuto, pois a bateria já foi lida no setup.
  if (ultimo_minuto_da_bateria == 255) {
    ultimo_minuto_da_bateria = horario.minuto;
    return;
  }

  if (horario.minuto != ultimo_minuto_da_bateria) {
    ultimo_minuto_da_bateria = horario.minuto;
    atualizar_bateria_do_display();
  }
}

void setup()
{
  // A serial mostra diagnósticos de Wi-Fi, RTC e ESP-NOW.
  Serial.begin(115200);

  // O LED confirma a partida e depois apaga para economizar bateria.
  inicializar_led_status();

  // A interface aparece antes das operações que podem aguardar a rede.
  inicializar_tela();
  inicializar_medidor_bateria();
  atualizar_bateria_do_display();

  // O RTC é aberto e, com credenciais válidas, sincronizado por NTP.
  inicializar_wifi_e_horario();

  // O ESP-NOW começa depois do Wi-Fi para conservar o mesmo canal de rádio.
  iniciar_espnow();
  atualizar_relogio_e_bateria();
}

void loop()
{
  // O loop apenas coordena os três módulos da aplicação.
  processar_wifi_e_horario();
  receber_telemetria();
  atualizar_relogio_e_bateria();
  processar_atualizacoes_da_tela();
  delay(200);
}
