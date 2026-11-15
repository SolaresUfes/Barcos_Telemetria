#pragma once

// NÃO USAR A PORTA 19 DO ESP. 
// ESSA PORTA ESTÁ SENDO DESATIVADA PARA PODERMOS USAR O ADS.

/* --- BAUD RATES ---*/

#define BAUD_SERIAL 115200
#define BAUD_BMS 9600


/* --- PINOS --- */

// Pinos I2C
#define SDA_ADS 21
#define SCL_ADS 22

// Pinos BMS (MAX485)
#define RXD2 16
#define TXD2 17
#define RS485_CONTROL 23
