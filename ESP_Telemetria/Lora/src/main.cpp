#include <Arduino.h>
#include "NeoPixel.h"
#include "CONFIG.h"
#include "RECEPTOR.h"
#include "EMISSOR.h"

// /////////////////////////////////////////////
// /*                 RECEPTOR               */
// void setup(){
//     Serial.begin(BAUD_SERIAL);
//     LORA_iniciar_modulo_receptor();
    
//     LoRaConfig cfg;
//     cfg.uartBaud          = LoRaUartBaud::Baud115200;
//     cfg.enablePacketRssi  = true;
//     cfg.enableAmbientRssi = true;
//     cfg.address           = 0x0000;
//     LORA_configurar_modulo(cfg, false);

//     // Depois da configuração o módulo já está em modo normal a 115200
//     Serial2.end();
//     Serial2.begin(115200, SERIAL_8N1, RX_RECEPTOR, TX_RECEPTOR);
    
//     iniciar_NeoPixel();
// }

// static unsigned long ultimoPacote = 0;

// void loop(){
//     LORA_printar_pacote();
//     int rssi = lerIntensidadePacote();
//     if (rssi != 0) {
//         ultimoPacote = millis();
//         atualizar_cor_RSSI(rssi);
//     }
//     if (ultimoPacote != 0 && millis() - ultimoPacote > 5000) {
//         atualizar_cor_RSSI(-120);   // sem sinal: vermelho
//     }
// }

/////////////////////////////////////////////
/*                 EMISSOR                 */
int contador = 1;

void setup() {
  Serial.begin(BAUD_SERIAL);

    LoRaConfig cfg;
    cfg.address           = 0x0001;   // igual ao emissor
    cfg.enableAmbientRssi = true;     // necessário para o comando de RSSI
    cfg.enablePacketRssi  = false;    // não vamos usar o byte anexado
    LORA_configurar_modulo(cfg, false);
}

void loop() {
  String pacote = "TELEMETRIA_SOLARES | Pacote_ID: " + String(contador);
  
  LORA_enviar_pacote(pacote);
  
  contador++;
  delay(1000);
}