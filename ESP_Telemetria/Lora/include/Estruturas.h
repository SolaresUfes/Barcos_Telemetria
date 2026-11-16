#pragma once

#include <Arduino.h>

// Modos de operação definidos pelos pinos M0 e M1
enum class LoRaOperatingMode : uint8_t {
  Normal      = 0, // M0 = 0, M1 = 0 (Transmissão e recepção padrão)
  WorTransmit = 1, // M0 = 1, M1 = 0 (Transmissor Wake-on-Radio)
  WorReceive  = 2, // M0 = 0, M1 = 1 (Receptor Wake-on-Radio)
  ConfigSleep = 3  // M0 = 1, M1 = 1 (Deep Sleep e Configuração via UART)
};

// REG0 [Bits 7:5] - Taxa da porta serial UART
enum class LoRaUartBaud : uint8_t {
  Baud1200   = 0b000,
  Baud2400   = 0b001,
  Baud4800   = 0b010,
  Baud9600   = 0b011, // Padrão obrigatório no Modo de Configuração (M0=1, M1=1)
  Baud19200  = 0b100,
  Baud38400  = 0b101,
  Baud57600  = 0b110,
  Baud115200 = 0b111
};

// REG0 [Bits 4:3] - Paridade da UART
enum class LoRaUartParity : uint8_t {
  Parity8N1 = 0b00,
  Parity8O1 = 0b01,
  Parity8E1 = 0b10
};

// REG0 [Bits 2:0] - Taxa de dados no ar (Air Data Rate)
enum class LoRaAirDataRate : uint8_t {
  Rate2_4k  = 0b010, // Maior alcance e imunidade a ruído (padrão)
  Rate4_8k  = 0b011,
  Rate9_6k  = 0b100,
  Rate19_2k = 0b101,
  Rate38_4k = 0b110,
  Rate62_5k = 0b111  // Menor latência, menor alcance
};

// REG1 [Bits 7:6] - Tamanho máximo do sub-pacote
enum class LoRaSubPacketSize : uint8_t {
  Bytes200 = 0b00,
  Bytes128 = 0b01,
  Bytes64  = 0b10,
  Bytes32  = 0b11
};

// REG1 [Bits 1:0] - Nível de potência de transmissão
// Versão 30 dBm (1W, o nosso): Level0=30dBm, Level1=27dBm, Level2=24dBm, Level3=21dBm
// Versão 22 dBm:               Level0=22dBm, Level1=17dBm, Level2=13dBm, Level3=10dBm
enum class LoRaTxPower : uint8_t {
  Level0_Max  = 0b00,
  Level1_High = 0b01,
  Level2_Mid  = 0b10,
  Level3_Low  = 0b11
};

// REG3 [Bits 2:0] - Ciclo de Wake-on-Radio (WOR)
enum class LoRaWorCycle : uint8_t {
  Ms500  = 0b000,
  Ms1000 = 0b001,
  Ms1500 = 0b010,
  Ms2000 = 0b011,
  Ms2500 = 0b100,
  Ms3000 = 0b101,
  Ms3500 = 0b110,
  Ms4000 = 0b111
};

// Estrutura completa dos parâmetros do módulo LoRa (Registradores 00H a 07H)
struct LoRaConfig {
  uint16_t address             = 0x0000; // ADDH (00H) + ADDL (01H)
  LoRaUartBaud uartBaud        = LoRaUartBaud::Baud9600;
  LoRaUartParity uartParity    = LoRaUartParity::Parity8N1;
  LoRaAirDataRate airDataRate  = LoRaAirDataRate::Rate2_4k;
  LoRaSubPacketSize packetSize = LoRaSubPacketSize::Bytes200;
  bool enableAmbientRssi       = false;
  LoRaTxPower txPower          = LoRaTxPower::Level3_Low; // 21 dBm na versão 30dBm
  uint8_t channel              = 65;    // REG2 (04H): 850.125 + 65 = 915.125 MHz (ISM Brasil)
  bool enablePacketRssi        = false; // REG3 Bit 7: Anexa byte de RSSI ao final do pacote
  bool fixedTransmission       = false; // REG3 Bit 6: false = Transparente, true = Fixo
  bool enableLbt               = false; // REG3 Bit 4: Listen Before Talk
  bool worTransmitter          = false; // REG3 Bit 3: Modo transmissor WOR
  LoRaWorCycle worCycle        = LoRaWorCycle::Ms2000;
  uint16_t encryptionKey       = 0x0000; // CRYPT_H (06H) + CRYPT_L (07H)
};