// #include <Arduino.h>
// #include "NeoPixel.h"
// #include "CONFIG.h"
// #include "RECEPTOR.h"
// #include "EMISSOR.h"

// /////////////////////////////////////////////
// /*                 RECEPTOR               */
// void setup(){
//     Serial.begin(BAUD_SERIAL);
//     LORA_iniciar_modulo_receptor();
    
//     LoRaConfig cfg;
//     cfg.enablePacketRssi  = false; // Desativa o byte 0x00 bugado no fim da string
//     cfg.enableAmbientRssi = true;  // Ativa o leitor de RSSI do E220 (Bit 5 do REG1)
//     LORA_configurar_modulo(cfg, true); // true = salva na EEPROM (0xC0)
    
//     iniciar_NeoPixel();
// }

// void loop(){
//     LORA_printar_pacote();
//     int rssi = lerIntensidadePacote();
//     if (rssi != 0) {
//         Serial.print("RSSI lido: ");
//         Serial.println(rssi);
//         atualizar_cor_RSSI(rssi);
//     }
// }

// /////////////////////////////////////////////
// /*                 EMISSOR                 */
// int contador = 1;

// void setup() {
//   Serial.begin(BAUD_SERIAL);

//   LoRaConfig cfg;
//   // Mantém RSSI desativado no emissor, mas aplica canal/endereço/potência padrão
//   LORA_configurar_modulo(cfg); 
  
//   LORA_iniciar_modulo_emissor();
// }

// void loop() {
//   String pacote = "TELEMETRIA_SOLARES | Pacote_ID: " + String(contador);
  
//   LORA_enviar_pacote(pacote);
  
//   contador++;
//   delay(1000);
// }