#include <Arduino.h>
#include <Wire.h>             // I2C
#include <Adafruit_ADS1X15.h> // ADS

// ===================Definições==================

// Pinos I2C
#define SDA_ADS 21
#define SCL_ADS 22

// OFFSET DO SENSOR HALL
#define numero_magico 2.500125 // Esse número foi coletado experimentalmente como o valor "padrão" do 0V vindos da resposta do sensor de efeito hall. Subtrimos ele do vlaor recebido pra termos uma resposta que gira em torno de um 0V

// Vamos usar o ADS para 4 coisas, a priori: Os sensores de efeito hall (3) nos tres primeiros canais [A0, A1, A2] e um canal para referencia [A3] (não vamos mexer pra nao interferir)
// Criei essa estrutura pra nao precisar ficar enviando 3 funções por loop. Essa estrutura recebera os valores de cada ads em cada variavel, se for pedido o valor da medição daquele canal do ADS
struct resposta_ADS {
    double ADS0, ADS1, ADS2;
};

// Cria o objeto do ADS1115.
Adafruit_ADS1115 ads;

// Essa função coleta os dados do ADS. Voce escolhe de quais portas serao coletados colocando "true" dentro da função no loop. Ex.: "coleta_ADS(true, false, true)" retornará os valores para os canais A0 e A2 do ADS, enquanto o A1 não é verificado
resposta_ADS coleta_ADS(bool ads0=false, bool ads1=false, bool ads2=false, bool subtrair_magico=false);

// A lógica dessa função acerca da escolha é igual a da função anterior, com a escolha dependendo do "true" ou "false", mas essa é so pra imprimir os valores no Serial.
void visualizar_ADS(resposta_ADS valores_ADS, bool ads0=false, bool ads1=false, bool ads2=false);


// ==================Setup e Loop==================

void setup() {

    Serial.begin(115200);

    iniciar_ADS(SDA_ADS, SCL_ADS);

    // O "Gain" (Ganho) define a faixa máxima de tensão que o módulo pode ler.
    // GAIN_TWOTHIRDS permite ler de -6.144V até +6.144V (Faixa padrão, mas nao sei o que eles vao querer usar)
    // GAIN_ONE permite ler de -4.096V até +4.096V
    ads.setGain(GAIN_ONE);

}

void loop() {

    resposta_ADS valores_ADS = coleta_ADS();
    visualizar_ADS(valores_ADS);

    delay(100); // Uma leitura a cada 1/10 segundo
}


// ===============Funções auxiliares===============

void iniciar_ADS(int SDA, int SCL) {
    
    // Inicia a comunicação I2C nos pinos 21 e 22
    Wire.begin(SDA, SCL);

    Serial.println("Inicializando o ADS");

    // Tenta iniciar o módulo ADS.
    while (!ads.begin()) {
        Serial.println("Falha ao iniciar o ADS. Verifique as conexões!");
        delay(1000); // Se deu ruim, tenta de novo de segundo em segundo até termos alguma coisa diferente
    }

    Serial.println("ADS iniciado com sucesso!");
}

resposta_ADS coleta_ADS(bool ads0=false, bool ads1=false, bool ads2=false, bool subtrair_magico=false){
    
    double soma0 = 0, soma1 = 0, soma2 = 0;                 // Variável da soma total pra média em cada canal do ADS
    double resultado0 = 0, resultado1 = 0, resultado2 = 0;  // Variável do valor final a ser inserido na estrutura em cada canal do ADSss

    if (ads0){

        // Lê 20 vezes o canal e, no fim, tira a média das 20 leituras. Isso diminui um pouco a flutuação natural e filtra um pouco dos ruidos
        for (int i = 0; i < 20; i++) {
            int16_t raw = ads.readADC_Differential_0_3();
            soma0 += ads.computeVolts(raw);
        }
        soma0 = soma0 / 20.0;

        // Subtrai o valor pelo "número mágico" (variável nomeada pelo Dudu) que é o valor experimental pra dar 0V na saída, se o programador quiser
        resultado0 = soma0;
        if (subtrair_magico) resultado0 -= numero_magico;
    }

    if (ads1){
        
        for (int i = 0; i < 20; i++) {
            int16_t raw = ads.readADC_Differential_1_3();
            soma1 += ads.computeVolts(raw);
        }
        soma1 = soma1 / 20.0;

        resultado1 = soma1;
        if (subtrair_magico) resultado1 -= numero_magico;

    }

    if (ads2){
        
        for (int i = 0; i < 20; i++) {
            int16_t raw = ads.readADC_Differential_2_3();
            soma2 += ads.computeVolts(raw);
        }
        soma2 = soma2 / 20.0;

        resultado2 = soma2;
        if (subtrair_magico) resultado2 -= numero_magico;
    }
    
    // Esse "return" retorna um valor do tipo "(resposta_ADS)", que é uma estrutura, com os valores "{resultado0, resultado1, resultado2}". É como retornar um vetor...
    return (resposta_ADS){resultado0, resultado1, resultado2};
}

void visualizar_ADS(resposta_ADS valores_ADS, bool ads0=false, bool ads1=false, bool ads2=false){

    if (ads0) Serial.printf("ADS0: %fV \n", valores_ADS.ADS0);
    if (ads1) Serial.printf("ADS1: %fV \n", valores_ADS.ADS1);
    if (ads2) Serial.printf("ADS2: %fV \n", valores_ADS.ADS2);
}
