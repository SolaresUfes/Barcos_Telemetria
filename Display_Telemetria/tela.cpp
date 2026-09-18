#include "tela.h"

#include <Arduino.h>
#include <assert.h>
#include <esp_heap_caps.h>
#include <esp_timer.h>
#include <limits.h>
#include <math.h>
#include <lvgl.h>

#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

#include "src/display/epaper_driver_bsp.h"
#include "src/power/board_power_bsp.h"
#include "user_config.h"

// Fontes oficiais da Waveshare usadas em dois tamanhos nesta interface.
LV_FONT_DECLARE(lv_font_montserratMedium_20);
LV_FONT_DECLARE(lv_font_montserrat_10);

// A e-paper é atualizada no máximo uma vez por segundo para telemetria.
static constexpr uint32_t INTERVALO_MINIMO_TELEMETRIA_MS = 1000;

// Cinco centiampères equivalem à tolerância visual de 0,05 A.
static constexpr int LIMIAR_CORRENTE_CENTIAMPERES = 5;

// Estes objetos pertencem ao módulo da tela e não ficam expostos à aplicação.
static epaper_driver_display *driver = nullptr;
static board_power_bsp_t energia(EPD_PWR_PIN, Audio_PWR_PIN, VBAT_PWR_PIN);
static SemaphoreHandle_t mutex_lvgl = nullptr;
static TaskHandle_t tarefa_lvgl_handle = nullptr;
static volatile bool atualizacao_tela_pendente = false;

// A interface guarda apenas os rótulos que mudam durante o funcionamento.
static lv_obj_t *rotulo_bateria_barco = nullptr;
static lv_obj_t *rotulo_corrente = nullptr;
static lv_obj_t *rotulo_hora = nullptr;
static lv_obj_t *rotulo_bateria_display = nullptr;
static lv_obj_t *rotulo_estado = nullptr;

// Valores recebidos ficam pendentes até chegar o momento seguro de redesenhar.
// Menos um representa somente o estado anterior ao primeiro pacote ESP-NOW.
static float bateria_pendente = -1.0f;
static float corrente_pendente = -1.0f;
static bool ha_telemetria_pendente = false;
static uint32_t ultima_atualizacao_telemetria = 0;
static uint8_t ultimo_minuto_exibido = 255;

// Guardamos exatamente os valores que aparecem escritos. Assim, um pacote
// novo que produziria o mesmo texto não provoca outro ciclo da e-paper.
static int bateria_exibida = INT_MIN;
static int corrente_centiamperes_exibida = INT_MIN;

// O mutex impede que o loop e a tarefa interna do LVGL alterem a tela juntos.
static bool bloquear_lvgl(int tempo_ms = -1)
{
  const TickType_t espera = tempo_ms < 0 ? portMAX_DELAY : pdMS_TO_TICKS(tempo_ms);
  return xSemaphoreTake(mutex_lvgl, espera) == pdTRUE;
}

// Libera o LVGL para a próxima tarefa que precisar desenhar.
static void desbloquear_lvgl()
{
  xSemaphoreGive(mutex_lvgl);
}

// Acorda o LVGL quando um texto muda, sem esperar a verificação de segurança.
static void solicitar_atualizacao_lvgl()
{
  atualizacao_tela_pendente = true;
  if (tarefa_lvgl_handle != nullptr) {
    xTaskNotifyGive(tarefa_lvgl_handle);
  }
}

// Converte cada pixel do LVGL para preto ou branco e o envia à e-paper.
static void enviar_quadro_para_tela(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *cores)
{
  // O controlador perde sua RAM ao ficar sem alimentação. Ao religá-lo,
  // reconstruímos a imagem anterior antes de fazer a atualização parcial.
  energia.POWEER_EPD_ON();
  delay(10);
  driver->EPD_Init();
  driver->EPD_Init_Partial();
  driver->EPD_LoadPartBaseImage();

  uint16_t *pixel = reinterpret_cast<uint16_t *>(cores);
  driver->EPD_Clear();

  for (int y = area->y1; y <= area->y2; ++y) {
    for (int x = area->x1; x <= area->x2; ++x) {
      const uint8_t cor = *pixel < 0x7fff ? DRIVER_COLOR_BLACK : DRIVER_COLOR_WHITE;

      // A tela será instalada de lado; esta conversão gira o quadro inteiro
      // 90 graus no sentido horário antes de enviá-lo ao painel físico.
      const uint16_t x_rotacionado = EPD_WIDTH - 1 - y;
      const uint16_t y_rotacionado = x;
      driver->EPD_DrawColorPixel(x_rotacionado, y_rotacionado, cor);
      ++pixel;
    }
  }

  driver->EPD_DisplayPart();
  energia.POWEER_EPD_OFF();
  atualizacao_tela_pendente = false;
  lv_disp_flush_ready(disp);
}

// O timer informa ao LVGL a passagem do tempo em milissegundos.
static void aumentar_tick_lvgl(void *)
{
  lv_tick_inc(EXAMPLE_LVGL_TICK_PERIOD_MS);
}

// Esta tarefa executa a manutenção e os redesenhos solicitados pelo LVGL.
static void tarefa_lvgl(void *)
{
  for (;;) {
    // Sem mudanças, a tarefa acorda apenas uma vez por segundo.
    ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(EXAMPLE_LVGL_TASK_MAX_DELAY_MS));

    if (bloquear_lvgl()) {
      lv_timer_handler();
      // Também libera a espera quando o LVGL conclui sem precisar transferir
      // outro quadro para a e-paper.
      atualizacao_tela_pendente = false;
      desbloquear_lvgl();
    }
  }
}

// Cria um texto centralizado com a aparência usada em toda a interface.
static lv_obj_t *criar_rotulo_central(
  lv_obj_t *pai,
  const char *texto,
  int y,
  const lv_font_t *fonte = &lv_font_montserratMedium_20
)
{
  lv_obj_t *rotulo = lv_label_create(pai);
  lv_label_set_text(rotulo, texto);
  lv_obj_set_width(rotulo, 190);
  lv_obj_set_style_text_align(rotulo, LV_TEXT_ALIGN_CENTER, 0);
  lv_obj_set_style_text_color(rotulo, lv_color_black(), 0);
  lv_obj_set_style_text_font(rotulo, fonte, 0);
  lv_obj_align(rotulo, LV_ALIGN_TOP_MID, 0, y);
  return rotulo;
}

// Desenha uma linha horizontal entre as áreas da telemetria.
static void criar_separador(lv_obj_t *pai, int y)
{
  static lv_point_t pontos[3][2] = {
    {{8, 0}, {192, 0}},
    {{8, 0}, {192, 0}},
    {{8, 0}, {192, 0}}
  };
  static uint8_t indice = 0;

  lv_obj_t *linha = lv_line_create(pai);
  lv_line_set_points(linha, pontos[indice++], 2);
  lv_obj_set_style_line_color(linha, lv_color_black(), 0);
  lv_obj_set_style_line_width(linha, 1, 0);
  lv_obj_set_pos(linha, 0, y);
}

// Monta a tela de 200 por 200 pixels e guarda os campos que serão atualizados.
static void criar_interface()
{
  lv_obj_t *tela = lv_obj_create(nullptr);
  lv_obj_clear_flag(tela, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_set_style_bg_color(tela, lv_color_white(), 0);
  lv_obj_set_style_bg_opa(tela, LV_OPA_COVER, 0);
  lv_obj_set_style_border_width(tela, 0, 0);
  lv_obj_set_style_pad_all(tela, 0, 0);

  // Sem título, os três dados principais ganham mais espaço e fonte maior.
  // Menos um indica que ainda não chegou nenhum pacote da outra ESP.
  rotulo_bateria_barco = criar_rotulo_central(tela, "BATERIA: -1 %", 25);
  criar_separador(tela, 62);

  rotulo_corrente = criar_rotulo_central(tela, "C: -1.00 A", 82);
  criar_separador(tela, 119);

  // O relógio começa zerado e recebe o horário real somente depois que o RTC
  // é lido, evitando mostrar um horário fixo durante a inicialização.
  rotulo_hora = criar_rotulo_central(tela, "HORA: 00:00", 139);

  // A bateria do próprio display mantém a posição, mas usa uma fonte bem menor.
  rotulo_bateria_display = lv_label_create(tela);
  lv_label_set_text(rotulo_bateria_display, "DISPLAY: -- %");
  lv_obj_set_style_text_color(rotulo_bateria_display, lv_color_black(), 0);
  lv_obj_set_style_text_font(rotulo_bateria_display, &lv_font_montserrat_10, 0);
  lv_obj_align(rotulo_bateria_display, LV_ALIGN_BOTTOM_LEFT, 7, -7);

  // A e-paper conserva este estado mesmo quando a placa fica sem energia.
  rotulo_estado = lv_label_create(tela);
  lv_label_set_text(rotulo_estado, "ON");
  lv_obj_set_style_text_color(rotulo_estado, lv_color_black(), 0);
  lv_obj_set_style_text_font(rotulo_estado, &lv_font_montserrat_10, 0);
  lv_obj_align(rotulo_estado, LV_ALIGN_BOTTOM_RIGHT, -7, -7);

  lv_scr_load(tela);
}

void inicializar_tela()
{
  // Mantém a alimentação da bateria ligada depois que o botão é solto.
  energia.VBAT_POWER_ON();

  // A e-paper é necessária; o circuito de áudio não é usado neste projeto e
  // permanece sem alimentação durante todo o funcionamento.
  energia.POWEER_EPD_ON();
  energia.POWEER_Audio_OFF();

  // Mantém exatamente os pinos e parâmetros indispensáveis da placa.
  custom_lcd_spi_t configuracao = {};
  configuracao.cs = EPD_CS_PIN;
  configuracao.dc = EPD_DC_PIN;
  configuracao.rst = EPD_RST_PIN;
  configuracao.busy = EPD_BUSY_PIN;
  configuracao.mosi = EPD_MOSI_PIN;
  configuracao.scl = EPD_SCK_PIN;
  configuracao.spi_host = EPD_SPI_NUM;
  configuracao.buffer_len = 5000;

  // Inicializa a e-paper e faz uma única limpeza completa e visível.
  // DisplayPartBaseImage já envia o branco ao painel e também grava a imagem
  // de referência; chamar EPD_Display antes repetia o ciclo de limpeza.
  driver = new epaper_driver_display(EPD_WIDTH, EPD_HEIGHT, configuracao);
  driver->EPD_Init();
  driver->EPD_Clear();
  driver->EPD_DisplayPartBaseImage();
  delay(600);

  // Depois da confirmação visual, ativa as atualizações parciais rápidas.
  driver->EPD_Init_Partial();

  // Cria dois buffers na PSRAM para o desenho em preto e branco.
  lv_init();
  static lv_disp_draw_buf_t buffer_desenho;
  static lv_disp_drv_t driver_lvgl;
  lv_color_t *buffer_1 = static_cast<lv_color_t *>(heap_caps_malloc(LVGL_SPIRAM_BUFF_LEN, MALLOC_CAP_SPIRAM));
  lv_color_t *buffer_2 = static_cast<lv_color_t *>(heap_caps_malloc(LVGL_SPIRAM_BUFF_LEN, MALLOC_CAP_SPIRAM));
  assert(buffer_1 && buffer_2);
  lv_disp_draw_buf_init(&buffer_desenho, buffer_1, buffer_2, EPD_WIDTH * EPD_HEIGHT);

  // Liga o LVGL à função que transfere o quadro para o driver Waveshare.
  lv_disp_drv_init(&driver_lvgl);
  driver_lvgl.hor_res = EPD_WIDTH;
  driver_lvgl.ver_res = EPD_HEIGHT;
  driver_lvgl.flush_cb = enviar_quadro_para_tela;
  driver_lvgl.draw_buf = &buffer_desenho;
  driver_lvgl.full_refresh = 1;
  lv_disp_drv_register(&driver_lvgl);

  // Um timer periódico mantém a contagem de tempo interna do LVGL.
  esp_timer_create_args_t configuracao_timer = {};
  configuracao_timer.callback = aumentar_tick_lvgl;
  configuracao_timer.name = "tick_lvgl";
  esp_timer_handle_t timer_lvgl = nullptr;
  ESP_ERROR_CHECK(esp_timer_create(&configuracao_timer, &timer_lvgl));
  ESP_ERROR_CHECK(esp_timer_start_periodic(timer_lvgl, EXAMPLE_LVGL_TICK_PERIOD_MS * 1000));

  // A interface é criada antes de iniciar a tarefa que a mantém atualizada.
  mutex_lvgl = xSemaphoreCreateMutex();
  assert(mutex_lvgl);
  criar_interface();
  xTaskCreatePinnedToCore(
    tarefa_lvgl,
    "LVGL",
    8 * 1024,
    nullptr,
    4,
    &tarefa_lvgl_handle,
    1
  );

  // Mostra a interface inicial sem aguardar o primeiro segundo.
  solicitar_atualizacao_lvgl();
}

void agendar_telemetria_na_tela(float bateria_percentual, float corrente_amperes)
{
  // Sempre conserva o pacote mais novo, mesmo durante o intervalo de proteção.
  bateria_pendente = bateria_percentual;
  corrente_pendente = corrente_amperes;
  ha_telemetria_pendente = true;
}

void atualizar_horario_na_tela(uint8_t hora, uint8_t minuto)
{
  // Ignora um RTC inválido e também evita reescrever o mesmo minuto.
  if (hora > 23 || minuto > 59 || minuto == ultimo_minuto_exibido) {
    return;
  }

  char texto[16];
  snprintf(texto, sizeof(texto), "HORA: %02u:%02u", hora, minuto);

  // A troca do texto invalida apenas o necessário dentro do LVGL.
  if (bloquear_lvgl()) {
    lv_label_set_text(rotulo_hora, texto);
    desbloquear_lvgl();
    ultimo_minuto_exibido = minuto;
    solicitar_atualizacao_lvgl();
  }
}

void atualizar_bateria_display_na_tela(uint8_t percentual)
{
  // A porcentagem já chega limitada entre zero e cem pelo medidor.
  char texto[18];
  snprintf(texto, sizeof(texto), "DISPLAY: %u %%", percentual);

  if (bloquear_lvgl()) {
    lv_label_set_text(rotulo_bateria_display, texto);
    desbloquear_lvgl();
    solicitar_atualizacao_lvgl();
  }
}

void mostrar_desligamento_na_tela()
{
  if (rotulo_estado == nullptr || !bloquear_lvgl(2000)) {
    return;
  }

  // Força a atualização agora, pois logo depois a alimentação será cortada.
  lv_label_set_text(rotulo_estado, "OFF");
  lv_refr_now(nullptr);
  desbloquear_lvgl();
}

void processar_atualizacoes_da_tela()
{
  // Aguarda um segundo entre atualizações de telemetria da e-paper.
  if (!ha_telemetria_pendente ||
      millis() - ultima_atualizacao_telemetria < INTERVALO_MINIMO_TELEMETRIA_MS) {
    return;
  }

  // A bateria muda a cada ponto percentual. Na corrente, variações menores
  // que 0,05 A em relação ao último valor exibido são tratadas como ruído.
  const int nova_bateria_exibida = static_cast<int>(lroundf(bateria_pendente));
  const int nova_corrente_centiamperes = static_cast<int>(lroundf(corrente_pendente * 100.0f));
  const bool bateria_mudou = nova_bateria_exibida != bateria_exibida;
  const bool corrente_mudou =
    corrente_centiamperes_exibida == INT_MIN ||
    abs(nova_corrente_centiamperes - corrente_centiamperes_exibida) >=
      LIMIAR_CORRENTE_CENTIAMPERES;

  if (!bateria_mudou && !corrente_mudou) {
    ha_telemetria_pendente = false;
    return;
  }

  // Altera somente os rótulos cujo valor realmente cruzou seu limite.
  if (bloquear_lvgl()) {
    if (bateria_mudou) {
      char bateria[24];
      snprintf(bateria, sizeof(bateria), "BATERIA: %d %%", nova_bateria_exibida);
      lv_label_set_text(rotulo_bateria_barco, bateria);
      bateria_exibida = nova_bateria_exibida;
    }

    if (corrente_mudou) {
      char corrente[28];
      snprintf(corrente, sizeof(corrente), "C: %.2f A", nova_corrente_centiamperes / 100.0f);
      lv_label_set_text(rotulo_corrente, corrente);
      corrente_centiamperes_exibida = nova_corrente_centiamperes;
    }

    desbloquear_lvgl();
    solicitar_atualizacao_lvgl();

    ha_telemetria_pendente = false;
    ultima_atualizacao_telemetria = millis();
  }
}

bool aguardar_tela_ociosa(uint32_t tempo_limite_ms)
{
  const uint32_t inicio = millis();
  while (atualizacao_tela_pendente && millis() - inicio < tempo_limite_ms) {
    delay(5);
  }
  return !atualizacao_tela_pendente;
}
