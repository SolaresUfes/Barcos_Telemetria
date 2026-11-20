#pragma once

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include "NeoPixel.h"

void iniciar_NeoPixel(int intensidade = 30);

void atualizar_cor_RSSI(int rssi, int rssi_minimo = -120, int rssi_maximo = -30);
