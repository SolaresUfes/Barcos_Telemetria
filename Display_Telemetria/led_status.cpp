#include "led_status.h"

#include <Arduino.h>
#include <esp_timer.h>

#include "driver/gpio.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "tela.h"
#include "user_config.h"

// O esquema e o exemplo oficial ligam o LED verde ao GPIO 3.
static constexpr gpio_num_t PINO_LED_VERDE = GPIO_NUM_3;
static constexpr uint32_t TEMPO_LED_AO_LIGAR_MS = 5000;
static constexpr uint32_t TEMPO_LONGO_PARA_DESLIGAR_MS = 1000;
static constexpr uint32_t TEMPO_PISCADA_DESLIGAR_MS = 400;

// O LED fica entre 3,3 V e o GPIO, portanto acende em nível baixo.
static constexpr uint8_t LED_LIGADO = LOW;
static constexpr uint8_t LED_DESLIGADO = HIGH;
static volatile bool desligamento_solicitado = false;

// Converte milissegundos para o relógio de alta resolução do ESP32.
static int64_t micros_de(uint32_t milissegundos)
{
  return static_cast<int64_t>(milissegundos) * 1000;
}

// Esta tarefa mantém o LED independente de esperas da tela, do Wi-Fi e do NTP.
static void tarefa_led_e_botao(void *)
{
  bool partida_em_andamento = true;
  bool botao_de_partida_foi_liberado = false;
  bool contando_pressao = false;
  bool desligamento_em_andamento = false;

  int64_t instante_apagar_partida = esp_timer_get_time() + micros_de(TEMPO_LED_AO_LIGAR_MS);
  int64_t inicio_pressao = 0;
  int64_t instante_cortar_energia = 0;

  digitalWrite(PINO_LED_VERDE, LED_LIGADO);

  for (;;) {
    const int64_t agora = esp_timer_get_time();
    const bool botao_pressionado = digitalRead(PWR_BUTTON_PIN) == LOW;

    // O botão usado para ligar precisa ser solto antes de aceitar um desligamento.
    if (!botao_de_partida_foi_liberado) {
      if (!botao_pressionado) {
        botao_de_partida_foi_liberado = true;
      }
    } else if (!desligamento_em_andamento) {
      // O exemplo oficial considera um segundo como pressionamento longo.
      if (botao_pressionado && !contando_pressao) {
        contando_pressao = true;
        inicio_pressao = agora;
      } else if (!botao_pressionado) {
        contando_pressao = false;
      }

      if (contando_pressao && agora - inicio_pressao >= micros_de(TEMPO_LONGO_PARA_DESLIGAR_MS)) {
        desligamento_solicitado = true;
      }
    }

    // O botão e a proteção de bateria usam a mesma sequência de desligamento.
    if (botao_de_partida_foi_liberado &&
        desligamento_solicitado &&
        !desligamento_em_andamento) {
      desligamento_em_andamento = true;
      desligamento_solicitado = false;

      digitalWrite(PINO_LED_VERDE, LED_LIGADO);
      Serial.println("PWR: desligando a ESP");

      // Registra OFF na e-paper antes de soltar o circuito da bateria.
      mostrar_desligamento_na_tela();
      instante_cortar_energia = esp_timer_get_time() + micros_de(TEMPO_PISCADA_DESLIGAR_MS);
    }

    // A confirmação da partida dura cinco segundos completos.
    if (partida_em_andamento && agora >= instante_apagar_partida && !desligamento_em_andamento) {
      digitalWrite(PINO_LED_VERDE, LED_DESLIGADO);
      partida_em_andamento = false;
    }

    // Após a piscada, solta o circuito que mantém a bateria alimentando a placa.
    if (desligamento_em_andamento && agora >= instante_cortar_energia) {
      digitalWrite(PINO_LED_VERDE, LED_DESLIGADO);
      gpio_set_level(VBAT_PWR_PIN, 0);

      // Pela bateria a energia acaba aqui; com USB, a ESP permanece alimentada.
      vTaskDelete(nullptr);
    }

    vTaskDelay(pdMS_TO_TICKS(20));
  }
}

void inicializar_led_status()
{
  // O PWR é ativo em nível baixo e também é usado pelo circuito de energia.
  pinMode(PWR_BUTTON_PIN, INPUT_PULLUP);
  pinMode(PINO_LED_VERDE, OUTPUT);

  // A tarefa acompanha a duração do LED e reconhece o pressionamento longo.
  xTaskCreatePinnedToCore(
    tarefa_led_e_botao,
    "LED e botao PWR",
    3072,
    nullptr,
    3,
    nullptr,
    0
  );
}

void solicitar_desligamento()
{
  desligamento_solicitado = true;
}
