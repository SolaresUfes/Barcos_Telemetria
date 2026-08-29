#include <Arduino.h>          // Basicos do Arduino_ESP
#include <WiFi.h>             // Wi-Fi
#include <Wire.h>             // I2C
#include <HTTPClient.h>       // HTTP
#include <ArduinoJson.h>      // Json
#include <Adafruit_ADS1X15.h> // ADS

#define RXD2 16
#define TXD2 17
#define RS485_CONTROL 23

#define SCL_ADS 22 // D22
#define SDA_ADS 21 // D21

#define ADR_ADS

Adafruit_ADS1115 ads;

// ----------------- ESTRUTURAS DOS DADOS -----------------

// Estrutura com as variaveis dos dados do BMS
struct DADOS_BATERIA
{
    float tensao;
    float corrente;
    float porcentagem;
};

// Estrutura com os valores (TRUE or FALSE) dos alertas do BMS
struct ALERTAS_BATERIA
{
    bool celula_sobretensao;
    bool celula_subtensao;

    bool pack_sobretensao;
    bool pack_subtensao;

    bool temp_carga_alta;
    bool temp_carga_baixa;
    bool temp_descarga_alta;
    bool mosfet_temp_alta;

    bool corrente_carga_alta;
    bool corrente_descarga_alta;
    bool curto_circuito;
    bool mosfet_travado;

    bool alerta_ativo;
};

// Estrutura com dados individuais de tensao para cada celula
struct CELULAS_INDIVIDUAIS
{
    float celulas[16] = {0};
};

// ----------------- VARIAVEIS E CONSTANTES -----------------

// Dados pra conexão WiFi
const char *ssid = "aaa";
const char *password = "12345678";

// Fator de conversão exato para o Ganho de 2x (±2.048V)
// 2.048 Volts / 32768 Passos = 0.0000625 Volts por bit
const double VOLTS_PER_BIT = 0.000125; // 0,0000625

// Para conexão, colocamos o endereço do backend rodando no vercel
const char *Url_dados = "https://painel-f8r7.vercel.app/api/sensores";
const char *Url_alertas = "https://painel-f8r7.vercel.app/api/alertas";
const char *Url_celulas = "https://painel-f8r7.vercel.app/api/celulas";

// Comando geral que pode ser usado para tensao, corrente e porcentagem
byte status_geral[] = {0xA5, 0x40, 0x90, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7D}; // 381 -> 125 = 0x7D
// Comando para recebimento dos valores individuais de tensao por pack de bateria (32 packs)
byte cel_individual[] = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82};
// Comando pra recebimentos das falhas/alertas do BMS
// byte falhas[]       = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82
byte falhas[] = {0xA5, 0x40, 0x98, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85}; // 389 -> 133 = 0x85

// Variaveis de controle de tempo para substituir o delay no loop -> ADICIONADO
unsigned long tempo_anterior = 0;
const unsigned long intervalo_leitura = 2000;

// ----------------- FUNCOES AUXILIARES -----------------

DADOS_BATERIA ler_dados_bms();
ALERTAS_BATERIA ler_alertas_bms();
CELULAS_INDIVIDUAIS ler_celulas_bms();
ALERTAS_BATERIA interpretador(byte resposta[13]);

void enviar_dados_bateria(DADOS_BATERIA dado_bateria);
void enviar_alertas_bateria(ALERTAS_BATERIA alerta_bateria);
void enviar_dados_celulas(CELULAS_INDIVIDUAIS individuais);

void dados_ads();

void conectar_wifi(const char *nome_rede, const char *senha);
// Pega a estrutura de alertas e ve quem ta verdadeiro ou falso. Se houver verdadeira, adiciona ao json e depois cria a string de alertas pra serem enviados
String retornar_alertas(ALERTAS_BATERIA alertas);

// ----------------- SETUP -----------------

void setup()
{

    // Inicio do serial do monitor
    Serial.begin(115200);

    // Início do serial do BMS
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

    // Define o pino de controle do RS485 como OUTPUT
    pinMode(RS485_CONTROL, OUTPUT);

    // Começa sempre em modo de RECEPÇÃO
    digitalWrite(RS485_CONTROL, LOW);

    // Inicia o barramento I2C
    Wire.begin(SDA_ADS, SCL_ADS);

    // Conecta Wi-Fi
    conectar_wifi(ssid, password);

    if (!ads.begin())
        Serial.println("Falha ao iniciar o ADS1115!");

    ads.setGain(GAIN_ONE);
}

// ----------------- LOOP -----------------

void loop()
{

    // Tenta reconectar caso o Wi-Fi tenha caído
    if (WiFi.status() != WL_CONNECTED)
    {
        conectar_wifi(ssid, password);
    }

    unsigned long tempo_atual = millis();

    // Executa a leitura a cada intervalo_leitura
    if (tempo_atual - tempo_anterior >= intervalo_leitura)
    {

        tempo_anterior = tempo_atual;

        // leitura dos dados gerais
        DADOS_BATERIA BMS_dados = ler_dados_bms();

        // Envio dos dados
        enviar_dados_bateria(BMS_dados);

        // Alertas
        ALERTAS_BATERIA BMS_alertas = ler_alertas_bms();
        enviar_alertas_bateria(BMS_alertas);

        // Células
        CELULAS_INDIVIDUAIS BMS_celulas = ler_celulas_bms();
        enviar_dados_celulas(BMS_celulas);

        dados_ads();
    }
}

// ----------------- FUNÇÕES -----------------

DADOS_BATERIA ler_dados_bms()
{

    byte resposta[64];
    int n = 0;

    DADOS_BATERIA dados;

    // Inicializa como inválido. Se algo der errado, não enviaremos lixo.
    dados.tensao = NAN;
    dados.corrente = NAN;
    dados.porcentagem = NAN;

    // Limpa qlqr byte antigo do buffer
    while (Serial2.available())
    {
        Serial2.read();
    }

    // Transmissão HIGH
    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(status_geral, sizeof(status_geral));
    Serial2.flush();

    Serial.println("Comando de dados enviado!");

    // Transmissão LOW
    digitalWrite(RS485_CONTROL, LOW);

    // Espera a resposta
    unsigned long inicio_leitura = millis();

    while (n < 64 && (millis() - inicio_leitura < 250))
    {
        if (Serial2.available())
            resposta[n++] = Serial2.read();
    }

    // Verifica o tamanho (13 bytes)
    if (n < 13)
    {
        Serial.print("Resposta incompleta! Bytes recebidos: ");
        Serial.println(n);

        return dados;
    }

    // Mostra a resposta no serial (pode ser ocultado, mas é bom pra fazer teste)
    Serial.print("Resposta BMS: ");

    for (int i = 0; i < n; i++)
    {
        Serial.printf("%02X ", resposta[i]);
    }

    Serial.println();

    // Verifica o Header da mensagem. Se nao for '0x45', a mensagem nao é valida, pois esse nao é o byte inicial da mensagem (provavelmente pode ser lixo ou algum tipo de interferencia)
    if (resposta[0] != 0xA5)
    {

        Serial.println("Pacote invalido: HEADER incorreto.");

        return dados;
    }

    // Verifica o comando da resposta
    if (resposta[2] != 0x90)
    {

        Serial.println("Pacote invalido: comando incorreto.");

        return dados;
    }

    // Interpreta os dados brutos
    uint16_t tensao_bruta = ((int)resposta[4] << 8) | resposta[5];
    uint16_t corrente_bruta = ((int)resposta[8] << 8) | resposta[9];
    uint16_t porcentagem_bruta = ((int)resposta[10] << 8) | resposta[11];

    // Converte para algo mais 'refinado'
    dados.tensao = tensao_bruta / 10.0;
    dados.corrente = (corrente_bruta - 30000) / 10.0;
    dados.porcentagem = porcentagem_bruta / 10.0;

    // Área para monitorar no vscode
    Serial.print("Tensao: ");
    Serial.println(dados.tensao);

    Serial.print("Corrente: ");
    Serial.println(dados.corrente);

    Serial.print("Porcentagem: ");
    Serial.println(dados.porcentagem);

    return dados;
}

ALERTAS_BATERIA ler_alertas_bms()
{

    byte resposta[64];
    int n = 0;

    // Começa sem nenhum alerta
    ALERTAS_BATERIA alertas = {};

    // Limpa buffer
    while (Serial2.available())
    {
        Serial2.read();
    }

    // Transmissão HIGH
    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(falhas, sizeof(falhas));
    Serial2.flush();

    Serial.println("Comando de alertas enviado!");

    // Transmissão LOW
    digitalWrite(RS485_CONTROL, LOW);

    unsigned long inicio_leitura = millis();

    while (n < 64 && (millis() - inicio_leitura < 250))
    {
        if (Serial2.available())
            resposta[n++] = Serial2.read();
    }

    // Checagem de tamanho
    if (n < 13)
    {

        Serial.print("Resposta de alertas incompleta! Bytes: ");
        Serial.println(n);
        return alertas;
    }

    // Checagem de Header
    if (resposta[0] != 0xA5)
    {

        Serial.println("Resposta de alertas invalida: HEADER.");
        return alertas;
    }

    // Checagem de comando de resposta
    if (resposta[2] != 0x98)
    {
        Serial.println("Resposta de alertas invalida: comando.");
        return alertas;
    }

    // Interpreta a resposta (tem outra função pra isso)
    alertas = interpretador(resposta);

    return alertas;
}

CELULAS_INDIVIDUAIS ler_celulas_bms()
{
    CELULAS_INDIVIDUAIS packs;

    // Inicializa as 16 células com zero
    for (int i = 0; i < 16; i++) packs.celulas[i] = 0.0;

    byte resposta[13];

    byte comando_celulas[] = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82};

    Serial2.write(comando_celulas, sizeof(comando_celulas));
    Serial2.flush();

    delay(10);

    digitalWrite(RS485_CONTROL, LOW);

    unsigned long inicio_leitura = millis();
    int frames_lidos = 0;

    while (frames_lidos < 6 && (millis() - inicio_leitura < 250)) {

        if (Serial2.available() >= 13) {
            int n = 0;

            while (n < 13) resposta[n++] = Serial2.read();

            if (resposta[0] == 0xA5 && resposta[2] == 0x95) {

                int frame = resposta[4];

                if (frame >= 1 && frame <= 6) {

                    int indice = (frame - 1) * 3;

                    if (indice < 16) {
                        packs.celulas[indice] =
                            ((resposta[5] << 8) | resposta[6]) / 1000.0;
                    }

                    if (indice + 1 < 16) {
                        packs.celulas[indice + 1] =
                            ((resposta[7] << 8) | resposta[8]) / 1000.0;
                    }

                    if (indice + 2 < 16) {
                        packs.celulas[indice + 2] =
                            ((resposta[9] << 8) | resposta[10]) / 1000.0;
                    }

                    frames_lidos++;
                }
            }
        }
    }

    return packs;
}

ALERTAS_BATERIA interpretador(byte resposta[13])
{

    byte alerta1 = resposta[4];
    byte alerta2 = resposta[5];

    // Inicializa todos os alertas dentro da struct como falsos
    ALERTAS_BATERIA alertas = {};

    if (alerta1 == 0 && alerta2 == 0)
    {
        Serial.println("Nenhum erro detectado!");
        Serial.println();
        return alertas;
    }

    // Erros nas celulas:
    alertas.celula_sobretensao = (alerta1 & (1 << 0)) != 0;
    alertas.celula_subtensao = (alerta1 & (1 << 1)) != 0;

    // Erros nos packs
    alertas.pack_sobretensao = (alerta1 & (1 << 2)) != 0;
    alertas.pack_subtensao = (alerta1 & (1 << 3)) != 0;

    // Erros de temperatura
    alertas.temp_carga_alta = (alerta1 & (1 << 4)) != 0;
    alertas.temp_carga_baixa = (alerta1 & (1 << 5)) != 0;
    alertas.temp_descarga_alta = (alerta1 & (1 << 6)) != 0;
    alertas.mosfet_temp_alta = (alerta1 & (1 << 7)) != 0;

    // Erros mais gerais
    alertas.corrente_carga_alta = (alerta2 & (1 << 0)) != 0;
    alertas.corrente_descarga_alta = (alerta2 & (1 << 1)) != 0;
    alertas.curto_circuito = (alerta2 & (1 << 2)) != 0;
    alertas.mosfet_travado = (alerta2 & (1 << 3)) != 0;

    alertas.alerta_ativo = (alertas.celula_sobretensao || alertas.celula_subtensao || alertas.corrente_carga_alta || alertas.corrente_descarga_alta || alertas.curto_circuito || alertas.mosfet_temp_alta || alertas.mosfet_travado || alertas.pack_sobretensao || alertas.pack_subtensao || alertas.temp_carga_alta || alertas.temp_carga_baixa || alertas.temp_descarga_alta);

    return alertas;
}

void conectar_wifi(const char *nome_rede, const char *senha)
{

    // A ideia é tentar por pouco tempo e depois desistir da conexão. Isso é melhor do que so deixar o codigo preso num loop infinito pra tentar conectar em algo que nao vai conectar
    if (WiFi.status() == WL_CONNECTED)
        return;

    Serial.println("Tentando conectar ao Wi-Fi...");

    WiFi.begin(nome_rede, senha);

    unsigned long inicio = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - inicio < 10000)
    {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {

        Serial.println("WiFi conectado!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        Serial.println();
    }
    else
    {
        Serial.println("Nao foi possivel conectar ao WiFi.");
        Serial.println("O ESP continuara funcionando sem internet.");
    }
}

void enviar_dados_bateria(DADOS_BATERIA dados)
{

    // Nao tenta enviar se nao tiver internet (evita travamento do ESP32)
    if (WiFi.status() != WL_CONNECTED)
        conectar_wifi(ssid, password);

    // Impede o envio de lixo (NAN) ao servidor caso a leitura falhe
    if (isnan(dados.tensao))
        return;

    // Cria o client HTTP
    HTTPClient http;

    // Inicia uma conexão com o backend usando a URL da rota do envio de dados (POST)
    http.begin(Url_dados);

    // Informa que os dados passados serão do tipo 'json'
    http.addHeader(
        "content-Type",
        "application/json");

    // Cria o json "cru", responsavel por, inicialmente, fazer o que sera enviado
    StaticJsonDocument<200> json_cru;

    // Insere, no arquivo "cru", os valores de tensao, corrente e porcentagem nas suas devidas colunas
    json_cru["tensao"] = dados.tensao;
    json_cru["corrente"] = dados.corrente;
    json_cru["porcentagem"] = dados.porcentagem;

    // Essa string sera o json que iremos enviar. Ela sera completa com os valores de "json_cru"
    String json_refinado;

    // Faz a inserção dos dados de forma segura nessa nova variavel
    serializeJson(json_cru, json_refinado);

    // Envia o json (POST) para o backend e coleta o dado de resposta dese envio. 200 - OK, 404 - nao encontrado...
    int codigo_resposta_http = http.POST(json_refinado);

    // Apenas uma forma de entender o que ta chegando e o que foi recebido de volta
    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);
    Serial.print("Codigo de resposta: ");
    Serial.println(codigo_resposta_http);
    Serial.println("");

    // Finaliza as comunicações
    http.end();
}

void enviar_alertas_bateria(ALERTAS_BATERIA alertas)
{

    // Nao tenta enviar se nao tiver internet (evita travamento do ESP32)
    if (WiFi.status() != WL_CONNECTED)
        conectar_wifi(ssid, password);

    if (!alertas.alerta_ativo)
        return;

    String json_refinado = retornar_alertas(alertas);

    HTTPClient http;

    http.begin(Url_alertas);

    http.addHeader(
        "Content-Type",
        "application/json");

    int codigo_resposta_http = http.POST(json_refinado);

    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);
    Serial.print("Codigo de resposta: ");
    Serial.println(codigo_resposta_http);
    Serial.println("");

    http.end();
}

void enviar_dados_celulas(CELULAS_INDIVIDUAIS dados)
{
    // Não tenta enviar se não tiver internet
    if (WiFi.status() != WL_CONNECTED)
        conectar_wifi(ssid, password);

    // Cria o client HTTP
    HTTPClient http;

    // Inicia uma conexão com o backend usando a URL da rota
    http.begin(Url_celulas);

    // Informa que os dados serão enviados como JSON
    http.addHeader(
        "content-Type",
        "application/json");

    // Cria o JSON que será enviado
    StaticJsonDocument<300> json_cru;

    // Cria o array "celula" dentro do JSON
    JsonArray array_celulas = json_cru["celula"].to<JsonArray>();

    // Insere as 16 células no array
    for (int i = 0; i < 16; i++)
    {
        array_celulas.add(dados.celulas[i]);
    }

    // String que receberá o JSON final
    String json_refinado;

    // Converte o JSON para String
    serializeJson(json_cru, json_refinado);

    // Envia o JSON para o backend
    int codigo_resposta_http = http.POST(json_refinado);

    // Mostra o que foi enviado e a resposta
    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);

    Serial.print("Codigo de resposta: ");
    Serial.println(codigo_resposta_http);

    Serial.println("");

    // Finaliza a comunicação
    http.end();
}

String retornar_alertas(ALERTAS_BATERIA alertas)
{

    // Cria o arquivo json cru pra colocar as coisas
    StaticJsonDocument<200> doc;

    JsonArray erros = doc.createNestedArray("codigos");

    if (alertas.celula_sobretensao == true)
        erros.add(1);
    if (alertas.celula_subtensao == true)
        erros.add(2);
    if (alertas.pack_sobretensao == true)
        erros.add(3);
    if (alertas.pack_subtensao == true)
        erros.add(4);
    if (alertas.temp_carga_alta == true)
        erros.add(5);
    if (alertas.temp_carga_baixa == true)
        erros.add(6);
    if (alertas.temp_descarga_alta == true)
        erros.add(7);
    if (alertas.mosfet_temp_alta == true)
        erros.add(8);
    if (alertas.corrente_carga_alta == true)
        erros.add(9);
    if (alertas.corrente_descarga_alta == true)
        erros.add(10);
    if (alertas.curto_circuito == true)
        erros.add(11);
    if (alertas.mosfet_travado == true)
        erros.add(12);

    String json_refinado;
    serializeJson(doc, json_refinado);

    return json_refinado;
}

void dados_ads()
{
    // Lê a diferença real entre AIN0 (Sensor) e AIN1 (Referência de 2.5V)

    int16_t a0 = ads.readADC_SingleEnded(0);
    int16_t a1 = ads.readADC_SingleEnded(1);
    int16_t a2 = ads.readADC_SingleEnded(2);
    int16_t a3 = ads.readADC_SingleEnded(3);
    // int16_t a2 = ads.readADC_Differential_0_3();

    Serial.printf("RAW: A0=%d | A1=%d | A2=%d | A3=%d\n", a0, a1, a2, a3);

    // Converte a leitura de bits para a diferença em Volts
    double a_diferencial0 = a0 * VOLTS_PER_BIT;
    double a_diferencial1 = a1 * VOLTS_PER_BIT;
    double a_diferencial2 = a2 * VOLTS_PER_BIT;
    double a_diferencial3 = a3 * VOLTS_PER_BIT;

    // Soma a referência para obter a tensão real do sensor
    double v_sensor0 = a_diferencial0 - a_diferencial3; // + V_REF;
    double v_sensor1 = a_diferencial1 - a_diferencial2; // + V_REF;

    // Imprime o resultado formatado com 5 casas decimais
    // Usamos 'double' no ESP32 pois ele suporta 15 dígitos de precisão total
    Serial.print("Tensao do Sensor Hall 0: ");
    Serial.print(v_sensor0, 5);
    Serial.println(" V");

    Serial.print("Tensao do Sensor Hall 1: ");
    Serial.print(v_sensor1, 5);
    Serial.println(" V");

    Serial.println();
}


/*
#include <Arduino.h>     // Basicos do Arduino_ESP
#include <WiFi.h>        // Wi-Fi
#include <HTTPClient.h>  // HTTP
#include <ArduinoJson.h> // Json
#include <Adafruit_ADS1X15.h>

#include <Wire.h> // I2C

#define RXD2 16
#define TXD2 17
#define RS485_CONTROL 23

#define SCL_ADS 22 // D22
#define SDA_ADS 21 // D21

#define ADR_ADS

Adafruit_ADS1115 ads;

// ----------------- ESTRUTURAS DOS DADOS -----------------

// Estrutura com as variaveis dos dados do BMS
struct DADOS_BATERIA
{
    float tensao;
    float corrente;
    float porcentagem;
};

// Estrutura com os valores (TRUE or FALSE) dos alertas do BMS
struct ALERTAS_BATERIA
{
    bool celula_sobretensao;
    bool celula_subtensao;

    bool pack_sobretensao;
    bool pack_subtensao;

    bool temp_carga_alta;
    bool temp_carga_baixa;
    bool temp_descarga_alta;
    bool mosfet_temp_alta;

    bool corrente_carga_alta;
    bool corrente_descarga_alta;
    bool curto_circuito;
    bool mosfet_travado;

    bool alerta_ativo;
};

// Estrutura com dados individuais de tensao para cada celula
struct CELULAS_INDIVIDUAIS
{
    float celulas[16] = {0};
};

// ----------------- VARIAVEIS E CONSTANTES -----------------

// Dados pra conexão WiFi
const char *ssid = "aaa";
const char *password = "12345678";

// Fator de conversão exato para o Ganho de 2x (±2.048V)
// 2.048 Volts / 32768 Passos = 0.0000625 Volts por bit
const double VOLTS_PER_BIT = 0.000125; // 0,0000625

// Para conexão, colocamos o endereço do backend rodando no vercel
const char *Url_dados = "https://painel-f8r7.vercel.app/api/sensores";
const char *Url_alertas = "https://painel-f8r7.vercel.app/api/alertas";
const char *Url_celulas = "https://painel-f8r7.vercel.app/api/celulas";

// Comando geral que pode ser usado para tensao, corrente e porcentagem
byte status_geral[] = {0xA5, 0x40, 0x90, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7D}; // 381 -> 125 = 0x7D
// Comando para recebimento dos valores individuais de tensao por pack de bateria (32 packs)
byte cel_individual[] = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82};
// Comando pra recebimentos das falhas/alertas do BMS
// byte falhas[]       = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82
byte falhas[] = {0xA5, 0x40, 0x98, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x85}; // 389 -> 133 = 0x85

// Variaveis de controle de tempo para substituir o delay no loop -> ADICIONADO
unsigned long tempo_anterior = 0;
const unsigned long intervalo_leitura = 2000;

// ----------------- FUNCOES AUXILIARES -----------------

DADOS_BATERIA ler_dados_bms();
ALERTAS_BATERIA ler_alertas_bms();
CELULAS_INDIVIDUAIS ler_celulas_bms();
ALERTAS_BATERIA interpretador(byte resposta[13]);

void enviar_dados_bateria(DADOS_BATERIA dado_bateria);
void enviar_alertas_bateria(ALERTAS_BATERIA alerta_bateria);
void enviar_dados_celulas(CELULAS_INDIVIDUAIS individuais);

void dados_ads();

void conectar_wifi(const char *nome_rede, const char *senha);
// Pega a estrutura de alertas e ve quem ta verdadeiro ou falso. Se houver verdadeira, adiciona ao json e depois cria a string de alertas pra serem enviados
String retornar_alertas(ALERTAS_BATERIA alertas);

// ----------------- SETUP -----------------

void setup()
{

    // Inicio do serial do monitor
    Serial.begin(115200);

    // Início do serial do BMS
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

    // Define o pino de controle do RS485 como OUTPUT
    pinMode(RS485_CONTROL, OUTPUT);

    // Começa sempre em modo de RECEPÇÃO
    digitalWrite(RS485_CONTROL, LOW);

    // Inicia o barramento I2C
    Wire.begin(SDA_ADS, SCL_ADS);

    // Conecta Wi-Fi
    conectar_wifi(ssid, password);

    if (!ads.begin())
        Serial.println("Falha ao iniciar o ADS1115!");

    ads.setGain(GAIN_ONE);
}

// ----------------- LOOP -----------------

void loop()
{

    // Tenta reconectar caso o Wi-Fi tenha caído
    if (WiFi.status() != WL_CONNECTED)
    {
        conectar_wifi(ssid, password);
    }

    unsigned long tempo_atual = millis();

    // Executa a leitura a cada intervalo_leitura
    if (tempo_atual - tempo_anterior >= intervalo_leitura) {
        Serial.println("----------------------");
        tempo_anterior = tempo_atual;

        // leitura dos dados gerais
        DADOS_BATERIA BMS_dados = ler_dados_bms();

        // Envio dos dados
        enviar_dados_bateria(BMS_dados);

        // Alertas
        ALERTAS_BATERIA BMS_alertas = ler_alertas_bms();
        enviar_alertas_bateria(BMS_alertas);

        // Células
        CELULAS_INDIVIDUAIS BMS_celulas = ler_celulas_bms();
        enviar_dados_celulas(BMS_celulas);

        dados_ads();
    }
}

// ----------------- FUNÇÕES -----------------

DADOS_BATERIA ler_dados_bms()
{

    byte resposta[64];
    int n = 0;

    DADOS_BATERIA dados;

    // Inicializa como inválido. Se algo der errado, não enviaremos lixo.
    dados.tensao = NAN;
    dados.corrente = NAN;
    dados.porcentagem = NAN;

    // Limpa qlqr byte antigo do buffer
    while (Serial2.available())
    {
        Serial2.read();
    }

    // Transmissão HIGH
    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(status_geral, sizeof(status_geral));
    Serial2.flush();

    Serial.println("Comando de dados enviado!");

    // Transmissão LOW
    digitalWrite(RS485_CONTROL, LOW);

    // Espera a resposta
    unsigned long inicio_leitura = millis();

    while (n < 64 && (millis() - inicio_leitura < 250))
    {
        if (Serial2.available())
            resposta[n++] = Serial2.read();
    }

    // Verifica o tamanho (13 bytes)
    if (n < 13)
    {
        Serial.print("Resposta incompleta! Bytes recebidos: ");
        Serial.println(n);

        return dados;
    }

    // Mostra a resposta no serial (pode ser ocultado, mas é bom pra fazer teste)
    Serial.print("Resposta BMS: ");

    for (int i = 0; i < n; i++)
    {
        Serial.printf("%02X ", resposta[i]);
    }

    Serial.println();

    // Verifica o Header da mensagem. Se nao for '0x45', a mensagem nao é valida, pois esse nao é o byte inicial da mensagem (provavelmente pode ser lixo ou algum tipo de interferencia)
    if (resposta[0] != 0xA5)
    {

        Serial.println("Pacote invalido: HEADER incorreto.");

        return dados;
    }

    // Verifica o comando da resposta
    if (resposta[2] != 0x90)
    {

        Serial.println("Pacote invalido: comando incorreto.");

        return dados;
    }

    // Interpreta os dados brutos
    uint16_t tensao_bruta = ((int)resposta[4] << 8) | resposta[5];
    uint16_t corrente_bruta = ((int)resposta[8] << 8) | resposta[9];
    uint16_t porcentagem_bruta = ((int)resposta[10] << 8) | resposta[11];

    // Converte para algo mais 'refinado'
    dados.tensao = tensao_bruta / 10.0;
    dados.corrente = (corrente_bruta - 30000) / 10.0;
    dados.porcentagem = porcentagem_bruta / 10.0;

    // Área para monitorar no vscode
    Serial.print("Tensao: ");
    Serial.println(dados.tensao);

    Serial.print("Corrente: ");
    Serial.println(dados.corrente);

    Serial.print("Porcentagem: ");
    Serial.println(dados.porcentagem);

    return dados;
}

ALERTAS_BATERIA ler_alertas_bms()
{

    byte resposta[64];
    int n = 0;

    // Começa sem nenhum alerta
    ALERTAS_BATERIA alertas = {};

    // Limpa buffer
    while (Serial2.available())
    {
        Serial2.read();
    }

    // Transmissão HIGH
    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(falhas, sizeof(falhas));
    Serial2.flush();

    Serial.println("Comando de alertas enviado!");

    // Transmissão LOW
    digitalWrite(RS485_CONTROL, LOW);

    unsigned long inicio_leitura = millis();

    while (n < 64 && (millis() - inicio_leitura < 250))
    {
        if (Serial2.available())
            resposta[n++] = Serial2.read();
    }

    // Checagem de tamanho
    if (n < 13)
    {

        Serial.print("Resposta de alertas incompleta! Bytes: ");
        Serial.println(n);
        return alertas;
    }

    // Checagem de Header
    if (resposta[0] != 0xA5)
    {

        Serial.println("Resposta de alertas invalida: HEADER.");
        return alertas;
    }

    // Checagem de comando de resposta
    if (resposta[2] != 0x98)
    {
        Serial.println("Resposta de alertas invalida: comando.");
        return alertas;
    }

    // Interpreta a resposta (tem outra função pra isso)
    alertas = interpretador(resposta);

    return alertas;
}

CELULAS_INDIVIDUAIS ler_celulas_bms()
{
    CELULAS_INDIVIDUAIS packs;

    // Inicializa as 16 células com zero
    for (int i = 0; i < 16; i++) packs.celulas[i] = 0.0;

    byte resposta[13];

    byte comando_celulas[] = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82};

    digitalWrite(RS485_CONTROL, HIGH);

    Serial2.write(comando_celulas, sizeof(comando_celulas));
    Serial2.flush();

    delay(10);

    digitalWrite(RS485_CONTROL, LOW);

    unsigned long inicio_leitura = millis();
    int frames_lidos = 0;

    while (frames_lidos < 6 && (millis() - inicio_leitura < 250)) {

        if (Serial2.available() >= 13) {
            int n = 0;

            while (n < 13) resposta[n++] = Serial2.read();

            if (resposta[0] == 0xA5 && resposta[2] == 0x95) {

                int frame = resposta[4];

                if (frame >= 1 && frame <= 6) {

                    int indice = (frame - 1) * 3;

                    if (indice < 16) {
                        packs.celulas[indice] =
                            ((resposta[5] << 8) | resposta[6]) / 1000.0;
                    }

                    if (indice + 1 < 16) {
                        packs.celulas[indice + 1] =
                            ((resposta[7] << 8) | resposta[8]) / 1000.0;
                    }

                    if (indice + 2 < 16) {
                        packs.celulas[indice + 2] =
                            ((resposta[9] << 8) | resposta[10]) / 1000.0;
                    }

                    frames_lidos++;
                }
            }
        }
    }

    return packs;
}

ALERTAS_BATERIA interpretador(byte resposta[13])
{

    byte alerta1 = resposta[4];
    byte alerta2 = resposta[5];

    // Inicializa todos os alertas dentro da struct como falsos
    ALERTAS_BATERIA alertas = {};

    if (alerta1 == 0 && alerta2 == 0)
    {
        Serial.println("Nenhum erro detectado!");
        Serial.println();
        return alertas;
    }

    // Erros nas celulas:
    alertas.celula_sobretensao = (alerta1 & (1 << 0)) != 0;
    alertas.celula_subtensao = (alerta1 & (1 << 1)) != 0;

    // Erros nos packs
    alertas.pack_sobretensao = (alerta1 & (1 << 2)) != 0;
    alertas.pack_subtensao = (alerta1 & (1 << 3)) != 0;

    // Erros de temperatura
    alertas.temp_carga_alta = (alerta1 & (1 << 4)) != 0;
    alertas.temp_carga_baixa = (alerta1 & (1 << 5)) != 0;
    alertas.temp_descarga_alta = (alerta1 & (1 << 6)) != 0;
    alertas.mosfet_temp_alta = (alerta1 & (1 << 7)) != 0;

    // Erros mais gerais
    alertas.corrente_carga_alta = (alerta2 & (1 << 0)) != 0;
    alertas.corrente_descarga_alta = (alerta2 & (1 << 1)) != 0;
    alertas.curto_circuito = (alerta2 & (1 << 2)) != 0;
    alertas.mosfet_travado = (alerta2 & (1 << 3)) != 0;

    alertas.alerta_ativo = (alertas.celula_sobretensao || alertas.celula_subtensao || alertas.corrente_carga_alta || alertas.corrente_descarga_alta || alertas.curto_circuito || alertas.mosfet_temp_alta || alertas.mosfet_travado || alertas.pack_sobretensao || alertas.pack_subtensao || alertas.temp_carga_alta || alertas.temp_carga_baixa || alertas.temp_descarga_alta);

    return alertas;
}

void conectar_wifi(const char *nome_rede, const char *senha)
{

    // A ideia é tentar por pouco tempo e depois desistir da conexão. Isso é melhor do que so deixar o codigo preso num loop infinito pra tentar conectar em algo que nao vai conectar
    if (WiFi.status() == WL_CONNECTED)
        return;

    Serial.println("Tentando conectar ao Wi-Fi...");

    WiFi.begin(nome_rede, senha);

    unsigned long inicio = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - inicio < 10000)
    {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {

        Serial.println("WiFi conectado!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        Serial.println();
    }
    else
    {
        Serial.println("Nao foi possivel conectar ao WiFi.");
        Serial.println("O ESP continuara funcionando sem internet.");
    }
}

void enviar_dados_bateria(DADOS_BATERIA dados)
{

    // Nao tenta enviar se nao tiver internet (evita travamento do ESP32)
    if (WiFi.status() != WL_CONNECTED)
        conectar_wifi(ssid, password);

    // Impede o envio de lixo (NAN) ao servidor caso a leitura falhe
    if (isnan(dados.tensao))
        return;

    // Cria o client HTTP
    HTTPClient http;

    // Inicia uma conexão com o backend usando a URL da rota do envio de dados (POST)
    http.begin(Url_dados);

    // Informa que os dados passados serão do tipo 'json'
    http.addHeader(
        "content-Type",
        "application/json");

    // Cria o json "cru", responsavel por, inicialmente, fazer o que sera enviado
    StaticJsonDocument<200> json_cru;

    // Insere, no arquivo "cru", os valores de tensao, corrente e porcentagem nas suas devidas colunas
    json_cru["tensao"] = dados.tensao;
    json_cru["corrente"] = dados.corrente;
    json_cru["porcentagem"] = dados.porcentagem;

    // Essa string sera o json que iremos enviar. Ela sera completa com os valores de "json_cru"
    String json_refinado;

    // Faz a inserção dos dados de forma segura nessa nova variavel
    serializeJson(json_cru, json_refinado);

    // Envia o json (POST) para o backend e coleta o dado de resposta dese envio. 200 - OK, 404 - nao encontrado...
    int codigo_resposta_http = http.POST(json_refinado);

    // Apenas uma forma de entender o que ta chegando e o que foi recebido de volta
    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);
    Serial.print("Codigo de resposta: ");
    Serial.println(codigo_resposta_http);
    Serial.println("");

    // Finaliza as comunicações
    http.end();
}

void enviar_alertas_bateria(ALERTAS_BATERIA alertas)
{

    // Nao tenta enviar se nao tiver internet (evita travamento do ESP32)
    if (WiFi.status() != WL_CONNECTED)
        conectar_wifi(ssid, password);

    if (!alertas.alerta_ativo)
        return;

    String json_refinado = retornar_alertas(alertas);

    HTTPClient http;

    http.begin(Url_alertas);

    http.addHeader(
        "Content-Type",
        "application/json");

    int codigo_resposta_http = http.POST(json_refinado);

    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);
    Serial.print("Codigo de resposta: ");
    Serial.println(codigo_resposta_http);
    Serial.println("");

    http.end();
}

void enviar_dados_celulas(CELULAS_INDIVIDUAIS dados)
{
    // Não tenta enviar se não tiver internet
    if (WiFi.status() != WL_CONNECTED)
        conectar_wifi(ssid, password);

    // Cria o client HTTP
    HTTPClient http;

    // Inicia uma conexão com o backend usando a URL da rota
    http.begin(Url_celulas);

    // Informa que os dados serão enviados como JSON
    http.addHeader(
        "content-Type",
        "application/json");

    // Cria o JSON que será enviado
    StaticJsonDocument<300> json_cru;

    // Cria o array "cells" dentro do JSON
    JsonArray array_celulas = json_cru["cells"].to<JsonArray>();

    // Insere as 16 células no array
    for (int i = 0; i < 16; i++)
    {
        array_celulas.add(dados.celulas[i]);
    }

    // String que receberá o JSON final
    String json_refinado;

    // Converte o JSON para String
    serializeJson(json_cru, json_refinado);

    // Envia o JSON para o backend
    int codigo_resposta_http = http.POST(json_refinado);

    // Mostra o que foi enviado e a resposta
    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);

    Serial.print("Codigo de resposta: ");
    Serial.print(codigo_resposta_http);
    Serial.print("  |  Resposta servidor: ");
    Serial.println(http.getString());
    Serial.println("");

    // Finaliza a comunicação
    http.end();
}

String retornar_alertas(ALERTAS_BATERIA alertas)
{

    // Cria o arquivo json cru pra colocar as coisas
    StaticJsonDocument<200> doc;

    JsonArray erros = doc.createNestedArray("codigos");

    if (alertas.celula_sobretensao == true)
        erros.add(1);
    if (alertas.celula_subtensao == true)
        erros.add(2);
    if (alertas.pack_sobretensao == true)
        erros.add(3);
    if (alertas.pack_subtensao == true)
        erros.add(4);
    if (alertas.temp_carga_alta == true)
        erros.add(5);
    if (alertas.temp_carga_baixa == true)
        erros.add(6);
    if (alertas.temp_descarga_alta == true)
        erros.add(7);
    if (alertas.mosfet_temp_alta == true)
        erros.add(8);
    if (alertas.corrente_carga_alta == true)
        erros.add(9);
    if (alertas.corrente_descarga_alta == true)
        erros.add(10);
    if (alertas.curto_circuito == true)
        erros.add(11);
    if (alertas.mosfet_travado == true)
        erros.add(12);

    String json_refinado;
    serializeJson(doc, json_refinado);

    return json_refinado;
}

void dados_ads()
{
    // Lê a diferença real entre AIN0 (Sensor) e AIN1 (Referência de 2.5V)

    int16_t a0 = ads.readADC_SingleEnded(0);
    int16_t a1 = ads.readADC_SingleEnded(1);
    int16_t a2 = ads.readADC_SingleEnded(2);
    int16_t a3 = ads.readADC_SingleEnded(3);
    // int16_t a2 = ads.readADC_Differential_2_3();

    Serial.printf("RAW: A0=%d | A1=%d | A2=%d | A3=%d\n", a0, a1, a2, a3);

    // Converte a leitura de bits para a diferença em Volts
    double a_diferencial0 = a0 * VOLTS_PER_BIT;
    double a_diferencial1 = a1 * VOLTS_PER_BIT;
    double a_diferencial2 = a2 * VOLTS_PER_BIT;
    double a_diferencial3 = a3 * VOLTS_PER_BIT;

    // Soma a referência para obter a tensão real do sensor
    double v_sensor0 = a_diferencial0 - a_diferencial3; // + V_REF;
    double v_sensor1 = a_diferencial1 - a_diferencial2; // + V_REF;

    // Imprime o resultado formatado com 5 casas decimais
    // Usamos 'double' no ESP32 pois ele suporta 15 dígitos de precisão total
    Serial.print("Tensao do Sensor Hall 0: ");
    Serial.print(v_sensor0, 5);
    Serial.println(" V");

    Serial.print("Tensao do Sensor Hall 1: ");
    Serial.print(v_sensor1, 5);
    Serial.println(" V");

    Serial.println();
}


*/