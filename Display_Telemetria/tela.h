#ifndef TELA_SOLARES_H
#define TELA_SOLARES_H

#include <stdint.h>

// Liga e configura a e-paper, inicia o LVGL e monta a interface.
void inicializar_tela();

// Guarda a telemetria mais recente para a próxima atualização permitida.
void agendar_telemetria_na_tela(float bateria_percentual, float corrente_amperes);

// Atualiza o relógio somente quando o minuto exibido realmente muda.
void atualizar_horario_na_tela(uint8_t hora, uint8_t minuto);

// Substitui o valor fixo pela porcentagem medida da bateria do display.
void atualizar_bateria_display_na_tela(uint8_t percentual);

// Grava OFF na e-paper antes que o circuito corte a alimentação da bateria.
void mostrar_desligamento_na_tela();

// Aplica atualizações pendentes sem provocar refresh excessivo da e-paper.
void processar_atualizacoes_da_tela();

#endif
