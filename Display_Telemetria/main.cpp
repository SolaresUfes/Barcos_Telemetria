#include <Arduino.h>
#include <esp_sleep.h>
#include <esp_timer.h>

#include "bateria.h"
#include "espnow.h"
#include "led_status.h"
#include "tela.h"
#include "user_config.h"
#include "wifi_horario.h"

// Guarda o minuto já processado para sincronizar relógio e bateria do display.
static uint8_t ultimo_minuto_da_bateria = 255;

// O display acorda uma vez por segundo, pede a amostra e volta a dormir.
static constexpr int64_t INTERVALO_CONSULTA_US = 1000000;
static constexpr uint32_t TEMPO_RESPOSTA_ESPNOW_MS = 150;
static constexpr uint32_t TEMPO_BOTAO_REINICIO_MS = 3000;
static constexpr uint8_t LIMITE_PEDIDOS_SEM_RESPOSTA = 3;

static uint8_t pedidos_sem_resposta = 0;
static bool contando_botao_reinicio = false;
static bool reinicio_ja_enviado_nesta_pressao = false;
static uint32_t inicio_botao_reinicio = 0;

// Um pressionamento longo evita reiniciar a ESP do barco por toque acidental.
static void processar_botao_reinicio_remoto()
{
  const bool pressionado = digitalRead(BOOT_BUTTON_PIN) == LOW;
  if (!pressionado) {
    contando_botao_reinicio = false;
    reinicio_ja_enviado_nesta_pressao = false;
    return;
  }

  if (!contando_botao_reinicio) {
    contando_botao_reinicio = true;
    inicio_botao_reinicio = millis();
    return;
  }

  if (!reinicio_ja_enviado_nesta_pressao &&
      millis() - inicio_botao_reinicio >= TEMPO_BOTAO_REINICIO_MS) {
    reinicio_ja_enviado_nesta_pressao = true;
    pedidos_sem_resposta = 0;
    atualizar_estado_comunicacao_na_tela(
      EstadoComunicacao::AGUARDANDO_PRIMEIRA_RESPOSTA
    );

    if (solicitar_reinicio_remoto()) {
      Serial.println("Comando de reinicio remoto enviado tres vezes.");
    } else {
      Serial.println("Falha imediata ao enviar o reinicio remoto.");
    }
  }
}

// Transfere para a tela o pacote mais recente recebido por ESP-NOW.
static bool receber_telemetria()
{
  TelemetriaBarco telemetria;
  if (obter_nova_telemetria(telemetria)) {
    agendar_telemetria_na_tela(
      telemetria.bateria_percentual,
      telemetria.corrente_amperes
    );
    return true;
  }
  return false;
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
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);

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
  const int64_t inicio_ciclo = esp_timer_get_time();
  processar_botao_reinicio_remoto();

  // Se a hora ainda não foi obtida, esta chamada aproveita uma eventual
  // reconexão. Depois da sincronização, ela retorna imediatamente.
  processar_wifi_e_horario();

  // O rádio só permanece ativo durante a solicitação e a pequena janela de
  // resposta. O transmissor devolve bateria e corrente no mesmo pacote.
  solicitar_telemetria();
  const uint32_t inicio_espera = millis();
  bool recebeu_resposta = false;
  while (millis() - inicio_espera < TEMPO_RESPOSTA_ESPNOW_MS) {
    if (receber_telemetria()) {
      recebeu_resposta = true;
      break;
    }
    delay(5);
  }

  if (recebeu_resposta) {
    pedidos_sem_resposta = 0;
    atualizar_estado_comunicacao_na_tela(EstadoComunicacao::CONECTADO);
  } else {
    if (pedidos_sem_resposta < LIMITE_PEDIDOS_SEM_RESPOSTA) {
      ++pedidos_sem_resposta;
    }
    if (pedidos_sem_resposta >= LIMITE_PEDIDOS_SEM_RESPOSTA) {
      atualizar_estado_comunicacao_na_tela(EstadoComunicacao::SEM_RESPOSTA);
    }
  }

  atualizar_relogio_e_bateria();
  processar_atualizacoes_da_tela();

  // Nunca corta o relógio da CPU no meio de uma transferência para a e-paper.
  aguardar_tela_ociosa(1500);

  // Mantém o início das consultas separado por aproximadamente um segundo.
  // Se o desenho já consumiu esse tempo, começa o próximo ciclo sem dormir.
  const int64_t tempo_usado = esp_timer_get_time() - inicio_ciclo;
  if (tempo_usado < INTERVALO_CONSULTA_US) {
    esp_sleep_enable_timer_wakeup(INTERVALO_CONSULTA_US - tempo_usado);
    esp_light_sleep_start();
  }
}
