#ifndef WIFI_HORARIO_H
#define WIFI_HORARIO_H

#include <stdint.h>

struct HorarioRtc {
  uint16_t ano;
  uint8_t mes;
  uint8_t dia;
  uint8_t hora;
  uint8_t minuto;
  uint8_t segundo;
};

// Abre o RTC e, quando configurado, usa Wi-Fi e NTP para acertá-lo.
void inicializar_wifi_e_horario();

// Tenta sincronizar o RTC; depois disso, abandona o roteador e mantém o ESP-NOW.
void processar_wifi_e_horario();

// Lê diretamente o PCF85063; a internet não é necessária depois da sincronização.
HorarioRtc ler_horario_rtc();

#endif
