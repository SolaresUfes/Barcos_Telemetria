#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h> // Biblioteca necessária para o ADS

// Definição dos pinos I2C
#define SDA_ADS 21 
#define SCL_ADS 22 
#define numero_magico 2.500125

// Vamos usar o ADS para 4 coisas, a priori: Os sensores de efeito hall (3) e um canal para referencia (não vamos mexer pra nao interferir)

// Cria o objeto do ADS1015. 
// Se o módulo for o ADS1115, é só trocar para 'Adafruit_ADS1115 ads;'
Adafruit_ADS1115 ads; 

void setup() {
    Serial.begin(115200);

    // Inicia a comunicação I2C nos pinos 21 e 22
    Wire.begin(SDA_ADS, SCL_ADS);

    Serial.println("Inicializando o ADS");

    // Tenta iniciar o módulo ADS. 
    if (!ads.begin()) {
        Serial.println("Falha ao iniciar o ADS. Verifique as conexões!");
        while (1); // Trava em um loop infinito (fiz isso pra não tentar fazer mais nada depois)
    }

    Serial.println("ADS iniciado com sucesso!");

    // O "Gain" (Ganho) define a faixa máxima de tensão que o módulo pode ler.
    // GAIN_TWOTHIRDS permite ler de -6.144V até +6.144V (Faixa padrão, mas nao sei o que eles vao querer usar)
    // GAIN_ONE permite ler de -4.096V até +4.096V
    ads.setGain(GAIN_ONE); 
}

void loop() {

    double soma = 0;

    for (int i = 0; i < 20; i++) {
        int16_t raw = ads.readADC_Differential_0_3();
        soma += ads.computeVolts(raw);
    }

    soma = soma/20.0;

    Serial.print("Tensao: ");
    Serial.print(soma - numero_magico, 6);
    Serial.println(" V");

    delay(50);
    
    // Lê o valor cru
    // double dadoA0 = ads.readADC_SingleEnded(0); //
    // double dadoA1 = ads.readADC_SingleEnded(1); //
    // double dadoA2 = ads.readADC_SingleEnded(2); //
    // double dadoA3 = ads.readADC_SingleEnded(3); //

    // double dadoA0 = ads.readADC_Differential_0_3(); //
    // int16_t dado = ads.readADC_Differential_1_3(); //

    // Serial.print("RAW: ");
    // Serial.println(dado);

    // double valor = ads.computeVolts(dado);

    // Serial.print("Valor: ");
    // Serial.println(valor, 8);

    // Serial.println();


    // // Esse codigo é literalemnte so de exemplo pq eu preciso saber o que os caras vao fazer com mais detalhes, mas eles nao falaram nada em todas as vezes que isso foi mencionado
    // // Depóis vou fazer (ou falar pra eles fazerem) o codigo mais voltado pras coisas especificas deles

    // // Lê o valor "cru" (em bits) do canal A0 do módulo ADS
    // int16_t leitura_A1 = ads.readADC_SingleEnded(1);
    // int16_t leitura_A3 = ads.readADC_SingleEnded(3);
    

    // // A biblioteca do Adafruit possui uma função que converte os bits automaticamente para Volts
    // double tensao_A1 = ads.computeVolts(leitura_A1);
    // double tensao_A3 = ads.computeVolts(leitura_A3);

    // Serial.print("Valor em bits (0): ");
    // Serial.println(tensao_A1 - tensao_A3);

    // delay(50); // Aguarda 1 segundo para a próxima leitura
}