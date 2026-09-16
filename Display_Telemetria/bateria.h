#ifndef BATERIA_DISPLAY_H
#define BATERIA_DISPLAY_H

#include <stdint.h>

// Configura o ADC usado pelo circuito de medição da bateria.
void inicializar_medidor_bateria();

// Faz uma leitura da tensão e entrega a porcentagem calculada.
bool obter_percentual_bateria(uint8_t &percentual);

#endif
