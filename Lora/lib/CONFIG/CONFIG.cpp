#include <Arduino.h>
#include "CONFIG.h"

// Definição dos pinos (para o esp32)
#define RXD2 16 // LARANJA
#define TXD2 17 // AMARELO
#define M0_PIN 18 // azul
#define M1_PIN 19 // verde

void configurarPotenciaLoRa() {
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  delay(1000); 

  // LIMPA O LIXO ELETRICO DO BUFFER ANTES DE QUALQUER COMANDO
  while(Serial2.available()) {
    Serial2.read();
  }

  Serial.println("\n--- ENVIANDO CONFIGURACAO (21 dBm) ---");

  // Comando para gravar 21 dBm (03 no REG1):
  // Configura uma lista de bytes para o módulo LoRa que configura a potência de transmissão para 21 dBm
  byte configCommand[] = {
    0xC0, // 1. Cabeçalho: Gravar configurações na memória permanente (EEPROM)
    0x00, // 2. Endereço Inicial: Começar a gravar no registrador 00H
    0x04, // 3. Tamanho: Ler e gravar os próximos 4 bytes na sequência
    0x00, // 4. ADDH (Registrador 00H): Endereço de rede Alto = 0
    0x00, // 5. ADDL (Registrador 01H): Endereço de rede Baixo = 0
    0x62, // 6. REG0 (Registrador 02H): Baud 9600, 8N1, Air Data Rate 2.4kbps
    0x03  // 7. REG1 (Registrador 03H): Pacote 200 bytes, Potência 21 dBm (125mW)
  }; 
    // O rádio parou de ler no REG1.
    // Portanto, se futuramente quisermos configurar o canal de rádio junto, só precisaria mudar
    // o tamanho para 0x05 e adicionar o byte do canal (ex: 0x17 para o canal 23) no final do array.
    // ADDx: address high ou address low
    // Canal: parte física, frequência a ser transmitida, como o andar de um prédio
    // Endereço: parte lógica, caminho a ser lido, como a porta de um andar

  Serial2.write(configCommand, sizeof(configCommand));

  Serial.print("Aguardando resposta do modulo... ");
  unsigned long startTime = millis();
  bool respondeu = false;

  while (millis() - startTime < 1000) {
    if (Serial2.available()) {
      if (!respondeu) {
        Serial.print("\nRecebido (Hex): ");
        respondeu = true;
      }
      byte resposta = Serial2.read();
      if (resposta < 0x10) Serial.print("0");
      Serial.print(resposta, HEX);
      Serial.print(" ");
    }
  }

  if (respondeu) {
    Serial.println("\n[SUCESSO] Configuracao validada!");
  } else {
    Serial.println("\n[ERRO] Nenhuma resposta.");
  }
}