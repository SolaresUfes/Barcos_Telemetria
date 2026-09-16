#include "bateria.h"

#include <Arduino.h>
#include <esp_adc/adc_cali.h>
#include <esp_adc/adc_cali_scheme.h>
#include <esp_adc/adc_oneshot.h>

// A Waveshare liga a bateria ao ADC1 canal 3 por um divisor de tensão de 1/2.
static constexpr adc_channel_t CANAL_BATERIA = ADC_CHANNEL_3;
static constexpr uint8_t QUANTIDADE_AMOSTRAS = 16;

static adc_oneshot_unit_handle_t adc = nullptr;
static adc_cali_handle_t calibracao = nullptr;
static bool medidor_inicializado = false;

// Limites usados pelo programa original de fábrica da Waveshare.
static constexpr uint16_t TENSAO_BATERIA_VAZIA_MV = 3000;
static constexpr uint16_t TENSAO_BATERIA_CHEIA_MV = 4120;

// Reproduz a conversão linear usada pela tela original da placa.
static uint8_t converter_tensao_em_percentual(uint16_t milivolts)
{
  if (milivolts >= TENSAO_BATERIA_CHEIA_MV) {
    return 100;
  }

  if (milivolts <= TENSAO_BATERIA_VAZIA_MV) {
    return 0;
  }

  const uint32_t faixa_total = TENSAO_BATERIA_CHEIA_MV - TENSAO_BATERIA_VAZIA_MV;
  const uint32_t acima_do_vazio = milivolts - TENSAO_BATERIA_VAZIA_MV;
  return static_cast<uint8_t>((acima_do_vazio * 100U) / faixa_total);
}

// Faz várias amostras para reduzir oscilações causadas pelo rádio e pela e-paper.
static uint16_t ler_tensao_media_em_milivolts()
{
  uint32_t soma = 0;

  for (uint8_t amostra = 0; amostra < QUANTIDADE_AMOSTRAS; ++amostra) {
    int valor_bruto = 0;
    if (adc_oneshot_read(adc, CANAL_BATERIA, &valor_bruto) != ESP_OK) {
      continue;
    }

    int milivolts_no_adc = 0;
    if (calibracao != nullptr) {
      adc_cali_raw_to_voltage(calibracao, valor_bruto, &milivolts_no_adc);
    } else {
      milivolts_no_adc = (valor_bruto * 3300) / 4095;
    }

    // O divisor entrega ao ADC metade da tensão real da bateria.
    soma += milivolts_no_adc * 2;
    delay(2);
  }

  return soma / QUANTIDADE_AMOSTRAS;
}

void inicializar_medidor_bateria()
{
  if (medidor_inicializado) {
    return;
  }

  // A configuração reproduz o exemplo ADC oficial da placa.
  adc_oneshot_unit_init_cfg_t configuracao_unidade = {};
  configuracao_unidade.unit_id = ADC_UNIT_1;
  ESP_ERROR_CHECK(adc_oneshot_new_unit(&configuracao_unidade, &adc));

  adc_oneshot_chan_cfg_t configuracao_canal = {};
  configuracao_canal.atten = ADC_ATTEN_DB_12;
  configuracao_canal.bitwidth = ADC_BITWIDTH_12;
  ESP_ERROR_CHECK(adc_oneshot_config_channel(adc, CANAL_BATERIA, &configuracao_canal));

  // A calibração converte o valor bruto do ADC em milivolts reais.
  adc_cali_curve_fitting_config_t configuracao_calibracao = {};
  configuracao_calibracao.unit_id = ADC_UNIT_1;
  configuracao_calibracao.chan = CANAL_BATERIA;
  configuracao_calibracao.atten = ADC_ATTEN_DB_12;
  configuracao_calibracao.bitwidth = ADC_BITWIDTH_12;
  if (adc_cali_create_scheme_curve_fitting(&configuracao_calibracao, &calibracao) != ESP_OK) {
    calibracao = nullptr;
  }

  medidor_inicializado = true;
}

bool obter_percentual_bateria(uint8_t &percentual)
{
  if (!medidor_inicializado) {
    return false;
  }

  const uint16_t tensao = ler_tensao_media_em_milivolts();
  percentual = converter_tensao_em_percentual(tensao);

  Serial.printf("Bateria do display: %.3f V, %u%%.\n", tensao / 1000.0f, percentual);
  return true;
}
