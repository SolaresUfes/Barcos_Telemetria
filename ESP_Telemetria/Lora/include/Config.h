#pragma once

/* Definições de BAUD */

#define BAUD_MODULOS 9600
#define BAUD_SERIAL 115200

/* Definições de pinos - RECEPTOR (Base ESP32) */

#define RX_RECEPTOR 16
#define TX_RECEPTOR 17

/* Definições de pinos - EMISSOR (Barco ESP32-S3) */

#define RX_EMISSOR 15
#define TX_EMISSOR 16

/* Definições de pinos - CONFIG (Bancada / Gravação de Registradores) */

#define RX_CONFIG 16 // Fio LARANJA (TXD do LoRa) (no 32-s3)
#define TX_CONFIG 17 // Fio AMARELO (RXD do LoRa) (no 32-s3)
#define M0_CONFIG 18 // Fio AZUL
#define M1_CONFIG 19 // Fio VERDE