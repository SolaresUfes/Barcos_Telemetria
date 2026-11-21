#pragma once

/* Definições de BAUD */

#define BAUD_MODULOS 9600
#define BAUD_SERIAL 115200

/* Definições de pinos - RECEPTOR (Base ESP32-S3) */

#define RX_RECEPTOR 15
#define TX_RECEPTOR 16
#define AUX_RECEPTOR 8 // AUX do LoRa: nível ALTO = módulo livre, BAIXO = módulo ocupado

/* Definições de pinos - EMISSOR (Barco ESP32-S3) */

#define RX_EMISSOR 15
#define TX_EMISSOR 16
#define AUX_EMISSOR 8 // AUX do LoRa: nível ALTO = módulo livre, BAIXO = módulo ocupado

/* Definições de pinos - CONFIG (Bancada / Gravação de Registradores) */

#define RX_CONFIG 15 // Fio LARANJA (TXD do LoRa) (no 32-s3)
#define TX_CONFIG 16 // Fio AMARELO (RXD do LoRa) (no 32-s3)
#define M0_CONFIG 17 // Fio AZUL
#define M1_CONFIG 18 // Fio VERDE
#define AUX_CONFIG 8 // Fio do AUX (mesmo pino físico do emissor/receptor)

/* Temporizações ligadas ao AUX (em ms) */

// Espera máxima pelo AUX subir ao ligar o módulo ou depois de trocar M0/M1.
#define AUX_TIMEOUT_MODO_MS 1000
// Espera máxima pelo módulo ficar livre antes de transmitir (com LBT ligado o módulo
// pode segurar o canal por até ~2 s, então precisa ser maior que isso).
#define AUX_TIMEOUT_TX_MS 3000
// Tempo mínimo depois de mexer em M0/M1 para o módulo perceber a troca e derrubar o AUX.
#define AUX_ATRASO_TROCA_MS 10
// Folga depois que o AUX volta a subir, antes de usar a UART no novo modo.
#define AUX_ATRASO_POS_MODO_MS 2