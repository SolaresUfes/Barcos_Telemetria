#include "Config.h"
#include <Arduino.h>


byte status_geral[]   = {0xA5, 0x40, 0x90, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7D}; // 381 -> 125 = 0x7D

void enviar_ler(byte comando[]);


void enviar_ler(byte comando[]){

    byte resposta[64];
    int n = 0;

    // Lê o teorico nada para limpar qualquer envio "fantasma" ou qualquer lixo de transmissao antes da leitura 
    while (Serial2.available()) Serial2.read();
    
    // Envia o comando
    Serial2.write(comando, 13);
    Serial2.flush();

    unsigned long tempo_anterior = millis();

    // Lê uma resposta
    while (n < 64 && millis() - tempo_anterior < 250) {
        if (Serial2.available()) {
            resposta[n++] = Serial2.read();
        }
    }

}