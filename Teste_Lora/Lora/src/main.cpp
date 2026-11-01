#include <Arduino.h>

// // ESP32-S3
// #define LORA_TX 17
// #define LORA_RX 18

// #define LORA_M0 4
// #define LORA_M1 5

// #define SERIAL_MONITOR_BAUD 115200
// #define LORA_UART_BAUD 9600

// // E220-900T30D configuration
// // Address: 0x0000
// // REG0: 9600 baud, 8N1, air rate 2.4 kbps
// // REG1: 200-byte packets, 30 dBm
// // REG2: channel 65 = 915.125 MHz
// // REG3: transparent mode, RSSI/LBT disabled

// const uint8_t CONFIG[6] = {
//     0x00, // ADDH
//     0x00, // ADDL
//     0x62, // REG0
//     0x00, // REG1
//     0x41, // REG2: channel 65
//     0x00  // REG3
// };

// bool configurarLoRa() {
//     uint8_t comando[9] = {
//         0xC0, 0x00, 0x06,
//         CONFIG[0], CONFIG[1], CONFIG[2],
//         CONFIG[3], CONFIG[4], CONFIG[5]
//     };

//     // Grava configuração permanente
//     while (Serial2.available()) Serial2.read();

//     Serial2.write(comando, sizeof(comando));
//     Serial2.flush();

//     delay(300);

//     // Lê a configuração gravada
//     uint8_t leitura[3] = {0xC1, 0x00, 0x06};

//     while (Serial2.available()) Serial2.read();

//     Serial2.write(leitura, sizeof(leitura));
//     Serial2.flush();

//     uint8_t resposta[9];
//     int recebidos = 0;
//     unsigned long inicio = millis();

//     while (millis() - inicio < 1500 && recebidos < 9) {
//         if (Serial2.available()) {
//             resposta[recebidos++] = Serial2.read();
//         }
//     }

//     Serial.print("Resposta de configuracao: ");

//     for (int i = 0; i < recebidos; i++) {
//         if (resposta[i] < 0x10) Serial.print('0');
//         Serial.print(resposta[i], HEX);
//         Serial.print(' ');
//     }
//     Serial.println();

//     if (recebidos != 9) return false;

//     if (resposta[0] != 0xC1 ||
//         resposta[1] != 0x00 ||
//         resposta[2] != 0x06) {
//         return false;
//     }

//     for (int i = 0; i < 6; i++) {
//         if (resposta[i + 3] != CONFIG[i]) {
//             return false;
//         }
//     }

//     return true;
// }

// void setup() {
//     Serial.begin(SERIAL_MONITOR_BAUD);

//     pinMode(LORA_M0, OUTPUT);
//     pinMode(LORA_M1, OUTPUT);

//     // Modo 3: configuração
//     digitalWrite(LORA_M0, HIGH);
//     digitalWrite(LORA_M1, HIGH);

//     delay(500);

//     // UART de configuração: 9600, 8N1
//     Serial2.begin(LORA_UART_BAUD, SERIAL_8N1, LORA_RX, LORA_TX);

//     Serial.println("Configurando E220 do transmissor...");

//     if (!configurarLoRa()) {
//         Serial.println("ERRO: nao foi possivel confirmar a configuracao.");
//         while (true) delay(1000);
//     }

//     Serial.println("Configuracao confirmada!");

//     // Modo 0: transmissão transparente
//     digitalWrite(LORA_M0, LOW);
//     digitalWrite(LORA_M1, LOW);

//     delay(500);

//     Serial2.begin(LORA_UART_BAUD, SERIAL_8N1, LORA_RX, LORA_TX);

//     Serial.println("Transmissor pronto!");
// }

// void loop() {
//     Serial2.println("Ola! E220 sincronizado - ESP32-S3");

//     Serial.println("Mensagem enviada");
//     delay(1000);
// }

// #include <Arduino.h>

// // ESP32 clássico
// #define LORA_TX 17
// #define LORA_RX 16

// #define LORA_M0 4
// #define LORA_M1 5

// #define SERIAL_MONITOR_BAUD 115200
// #define LORA_UART_BAUD 9600

// // Mesma configuração do transmissor
// const uint8_t CONFIG[6] = {
//     0x00, // ADDH
//     0x00, // ADDL
//     0x62, // REG0
//     0x00, // REG1
//     0x41, // REG2: channel 65 = 915.125 MHz
//     0x00  // REG3
// };

// bool configurarLoRa() {
//     uint8_t comando[9] = {
//         0xC0, 0x00, 0x06,
//         CONFIG[0], CONFIG[1], CONFIG[2],
//         CONFIG[3], CONFIG[4], CONFIG[5]
//     };

//     // Grava configuração permanente
//     while (Serial2.available()) Serial2.read();

//     Serial2.write(comando, sizeof(comando));
//     Serial2.flush();

//     delay(300);

//     // Lê os registradores
//     uint8_t leitura[3] = {0xC1, 0x00, 0x06};

//     while (Serial2.available()) Serial2.read();

//     Serial2.write(leitura, sizeof(leitura));
//     Serial2.flush();

//     uint8_t resposta[9];
//     int recebidos = 0;
//     unsigned long inicio = millis();

//     while (millis() - inicio < 1500 && recebidos < 9) {
//         if (Serial2.available()) {
//             resposta[recebidos++] = Serial2.read();
//         }
//     }

//     Serial.print("Resposta de configuracao: ");

//     for (int i = 0; i < recebidos; i++) {
//         if (resposta[i] < 0x10) Serial.print('0');
//         Serial.print(resposta[i], HEX);
//         Serial.print(' ');
//     }
//     Serial.println();

//     if (recebidos != 9) return false;

//     if (resposta[0] != 0xC1 ||
//         resposta[1] != 0x00 ||
//         resposta[2] != 0x06) {
//         return false;
//     }

//     for (int i = 0; i < 6; i++) {
//         if (resposta[i + 3] != CONFIG[i]) {
//             return false;
//         }
//     }

//     return true;
// }

// void setup() {
//     Serial.begin(SERIAL_MONITOR_BAUD);

//     pinMode(LORA_M0, OUTPUT);
//     pinMode(LORA_M1, OUTPUT);

//     // Modo 3: configuração
//     digitalWrite(LORA_M0, HIGH);
//     digitalWrite(LORA_M1, HIGH);

//     delay(500);

//     Serial2.begin(LORA_UART_BAUD, SERIAL_8N1, LORA_RX, LORA_TX);

//     Serial.println("Configurando E220 do receptor...");

//     if (!configurarLoRa()) {
//         Serial.println("ERRO: nao foi possivel confirmar a configuracao.");
//         while (true) delay(1000);
//     }

//     Serial.println("Configuracao confirmada!");

//     // Modo 0: recepção transparente
//     digitalWrite(LORA_M0, LOW);
//     digitalWrite(LORA_M1, LOW);

//     delay(500);

//     Serial2.begin(LORA_UART_BAUD, SERIAL_8N1, LORA_RX, LORA_TX);

//     Serial.println("Receptor pronto! Aguardando mensagens...");
// }

// void loop() {
//     while (Serial2.available()) {
//         char caractere = Serial2.read();
//         Serial.write(caractere);
//     }
// }



#include <Arduino.h>

#define LORA_TX 17
#define LORA_RX 18

#define LORA_M0 4
#define LORA_M1 5

void setup() {
    Serial.begin(115200);
    delay(1000);

    pinMode(LORA_M0, OUTPUT);
    pinMode(LORA_M1, OUTPUT);

    // Modo de configuração: M0=1, M1=1
    digitalWrite(LORA_M0, HIGH);
    digitalWrite(LORA_M1, HIGH);

    delay(1000);

    // UART de configuração
    Serial2.begin(9600, SERIAL_8N1, LORA_RX, LORA_TX);

    Serial.println("\n=== DIAGNOSTICO E220 ===");
    Serial.println("ESP32-S3");
    Serial.println("M0 = HIGH");
    Serial.println("M1 = HIGH");
    Serial.println("UART = 9600 8N1");

    delay(500);

    // Limpa qualquer dado anterior
    while (Serial2.available()) {
        Serial2.read();
    }

    // Comando para ler os registradores 00H a 05H
    uint8_t comando[] = {
        0xC1,
        0x00,
        0x06
    };

    Serial.println("\nEnviando: C1 00 06");

    Serial2.write(comando, sizeof(comando));
    Serial2.flush();

    Serial.println("Aguardando resposta...\n");

    unsigned long inicio = millis();
    int quantidade = 0;

    while (millis() - inicio < 3000) {
        while (Serial2.available()) {
            uint8_t recebido = Serial2.read();

            if (recebido < 0x10) {
                Serial.print("0");
            }

            Serial.print(recebido, HEX);
            Serial.print(" ");

            quantidade++;
        }
    }

    Serial.println("\n");

    Serial.print("Total de bytes recebidos: ");
    Serial.println(quantidade);

    if (quantidade > 0) {
        Serial.println("UART do modulo respondeu!");
    } else {
        Serial.println("NENHUMA RESPOSTA DO MODULO!");
    }
}

void loop() {
}