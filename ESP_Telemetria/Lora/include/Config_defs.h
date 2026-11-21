#pragma once

/* Definições de BAUD */

#define BAUD_MODULOS 9600
#define BAUD_SERIAL 115200

/* Definições de pinos - RECEPTOR (Base ESP32-S3) */

#define RX_RECEPTOR 15
#define TX_RECEPTOR 16
#define AUX_RECEPTOR 8 // Não vai dar pra usar porque o abençoado do módulo foi soldado

/* Definições de pinos - EMISSOR (Barco ESP32-S3) */

#define RX_EMISSOR 15
#define TX_EMISSOR 16
#define AUX_EMISSOR 8

/* Definições de pinos - CONFIG (Bancada / Gravação de Registradores) */

#define RX_CONFIG 15 // Fio LARANJA (TXD do LoRa) (no 32-s3)
#define TX_CONFIG 16 // Fio AMARELO (RXD do LoRa) (no 32-s3)
#define M0_CONFIG 17 // Fio AZUL
#define M1_CONFIG 18 // Fio VERDE