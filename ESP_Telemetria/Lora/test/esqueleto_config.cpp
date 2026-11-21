// // Só pra copiar e colar o que for necessário na hora de configurar os LoRas

// #include "CONFIG.h"

// void setup(){
//     LoRaConfig cfg;
//     cfg.address           = 0x0001;                    // igual nos dois rádios
//     cfg.channel           = 65;                        // 915.125 MHz (ISM Brasil)
//     cfg.airDataRate       = LoRaAirDataRate::Rate2_4k; // maior alcance
//     cfg.uartBaud          = LoRaUartBaud::Baud9600;    // o EMISSOR/RECEPTOR usam 9600
//     cfg.txPower           = LoRaTxPower::Level0_Max;   // 21 dBm
//     cfg.fixedTransmission = false;                     // modo transparente
//     cfg.enablePacketRssi  = false;                     // Pacote com intensidade de sinal
//     cfg.enableLbt         = false;
//     cfg.encryptionKey     = 0x2026;                    // igual nos dois rádios
  
//     LORA_configurar_modulo(cfg);                       // true = grava na EEPROM (0xC0)
// }  