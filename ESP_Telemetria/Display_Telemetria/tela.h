#ifndef TELA_SOLARES_H
#define TELA_SOLARES_H

#include <stdint.h>

enum class EstadoComunicacao : uint8_t {
  AGUARDANDO_PRIMEIRA_RESPOSTA,
  CONECTADO,
  SEM_RESPOSTA
};

// Liga e configura a e-paper, inicia o LVGL e monta a interface.
void inicializar_tela();

// Guarda a telemetria mais recente para a próxima atualização permitida.
void agendar_telemetria_na_tela(float bateria_percentual, float corrente_amperes);

// Atualiza o relógio somente quando o minuto exibido realmente muda.
void atualizar_horario_na_tela(uint8_t hora, uint8_t minuto);

// Substitui o valor fixo pela porcentagem medida da bateria do display.
void atualizar_bateria_display_na_tela(uint8_t percentual);

// Mostra círculo, check ou X no rodapé conforme o enlace ESP-NOW.
void atualizar_estado_comunicacao_na_tela(EstadoComunicacao estado);

// Grava OFF na e-paper antes que o circuito corte a alimentação da bateria.
void mostrar_desligamento_na_tela();

// Aplica atualizações pendentes sem provocar refresh excessivo da e-paper.
void processar_atualizacoes_da_tela();

// Aguarda uma atualização física em andamento antes de colocar a ESP em sono.
bool aguardar_tela_ociosa(uint32_t tempo_limite_ms);

#endif
