#include "NeoPixel.h"

Adafruit_NeoPixel led(LEDS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

void iniciar_NeoPixel(int intensidade){
    // Cria o objeto led

    // Inicializa o objeto led
    led.begin();                    // prepara o pino 48 para saida de dados e começa a comunicação led:esp
    led.clear();                    // limpa o buffer de memória ram das informações do led pra garantir que ele inicie zerado (ele define r,g,b=0)
    led.setBrightness(intensidade); // seta a intensidade das cores que vão aparecer; não serve pra fazer fade pq é impreciso

    // Envia essa inicialização pro neopixel do esp
    led.show();

}

void atualizar_cor_RSSI(int rssi, int rssi_minimo, int rssi_maximo){
    // Mapear o valores do RSSI para um intervalo de 0 a 255
    int RSSI_limitado = constrain(rssi, rssi_minimo, rssi_maximo);                  // Faz os valores lidos do LoRa variarem só entre -120 e -30 (maximos e minimos tabelados no datasheet)
    uint8_t sinal     = map(RSSI_limitado, rssi_minimo, rssi_maximo, 0, 255);       // Converte o valor para uma nova escala de 0 a 255 pra colocar nas entradas do neopixel

    // Definição das cores
    uint8_t red, green; // inicialização em 0 pra atualizar depois

    /*CONFIGURANDO O DEGRADÊ DE CORES
        Se o sinal for ruim/mediano (entre 0 a 127), fixamos o vermelho no máximo e variamos o verde até chegar no amarelo (ficando de rgb(255,0,0) até rgb(255,255,0) )
        Por exemplo, se a qualidade do sinal der  uns 64, teremos um rgb(255,128,0), e se for 127 certinho, temos o amarelo do comentário de cima
    */
    if (sinal < 128){
        red   = 255;
        green = map(sinal, 0, 127, 0, 255);
    }
    // Quando o sinal começa a ficar bom, fixamos o verde no máximo e variamos o vermelho negativamente até chegar o verde absoluto rgb(0,255,0)
    else {
        red   = map(sinal, 127, 255, 255, 0); // Quanto mais forte o sinal, menos vermelho tem na cor
        green = 255;
    }

    /* Resumo da lógica toda:
        Começa em                          rgb(255,0,0)
        Vai somando verde até chegar em    rgb(255,255,0)
        Vai tirando vermelho até chegar em rgb(0,255,0)
    */

    // Envia a cor definida pro microship do NeoPixel
    led.setPixelColor(LED_INDEX, led.Color(red, green, 0));
    led.show();
}


