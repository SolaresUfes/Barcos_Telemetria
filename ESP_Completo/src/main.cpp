#include <Arduino.h>     // Basicos do Arduino_ESP
#include <WiFi.h>        // Wi-Fi
#include <HTTPClient.h>  // HTTP
#include <ArduinoJson.h> // Json

#include <Wire.h>        // I2C

#define RXD2 16
#define TXD2 17
#define RS485_CONTROL 4

#define SCL_ADS 19 // D19
#define SDA_ADS 21 // D21

#define ADR_ADS

// ----------------- ESTRUTURAS DOS DADOS ----------------- 

// Estrutura com as variaveis dos dados do BMS
struct DADOS_BATERIA {
  float tensao;
  float corrente;
  float porcentagem;
};

// Estrutura com os valores (TRUE or FALSE) dos alertas do BMS
struct ALERTAS_BATERIA {
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


// ----------------- VARIAVEIS E CONSTANTES ----------------- 

// Dados pra conexão WiFi
const char* ssid = "Francisco";
const char* password = "Fr@ncisco2025";

// Dados pra conexão com o backend
// Para conexão, colocamos o endereço do computador rodando o back. No caso, o meu
const char* Url_dados   = "http://192.168.1.9:3000/api/sensores";
const char* Url_alertas = "http://192.168.1.9:3000/api/alertas";

// Comando geral que pode ser usado para tensao, corrente e porcentagem
byte status_geral[] = {0xA5, 0x40, 0x90, 0x08, 0x00, 0x00, 0x00, 0x7D}; // 381 -> 125 = 0x7D
// Comando pra recebimentos das falhas/alertas do BMS
byte falhas[]       = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82


// ----------------- FUNCOES AUXILIARES ----------------- 

DADOS_BATERIA ler_dados_bms();
ALERTAS_BATERIA ler_alertas_bms();
ALERTAS_BATERIA interpretador(byte resposta[13]);

void enviar_dados_bateria(DADOS_BATERIA dado_bateria);
void enviar_alertas_bateria(ALERTAS_BATERIA alerta_bateria);
void conectar_wifi(const char *nome_rede, const char *senha);
// Pega a estrutura de alertas e ve quem ta verdadeiro ou falso. Se houver verdadeira, adiciona ao json e depois cria a string de alertas pra serem enviados
String retornar_alertas(ALERTAS_BATERIA alertas);


// ----------------- SETUP -----------------  
void setup() {

    // Inicio do serial
    Serial.begin(115200);

    // Inicia o barramento I2C
    Wire.begin();

    // Conecta Wi-Fi
    conectar_wifi(ssid, password);
}


// ----------------- LOOP ----------------- 

void loop() {

  // Transmissao HIGH
  digitalWrite(RS485_CONTROL, HIGH);
  delay(10);    
  DADOS_BATERIA BMS_dados = ler_dados_bms();

  digitalWrite(RS485_CONTROL, HIGH);
  delay(10);
  
  ALERTAS_BATERIA BMS_alertas = ler_alertas_bms();

  digitalWrite(RS485_CONTROL, LOW);
  
  enviar_dados_bateria(BMS_dados);

  enviar_alertas_bateria(BMS_alertas);

  delay(200);
}


// ----------------- FUNÇÕES EM SI -----------------

DADOS_BATERIA ler_dados_bms(){

  byte resposta[64];
  int n = 0;

  DADOS_BATERIA dados;

  Serial2.write(status_geral, 8);
  Serial2.flush();

  Serial.println("Comandos enviados!");
  delay(10);

  // Ativa o modo de recepção de dados
  digitalWrite(RS485_CONTROL, LOW);
  delay(50);
  
  // Leitura da resposta bit a bit
  while (Serial2.available() && n < 64) {
    resposta[n++] = Serial2.read();
  }

  // A resposta SEMPRE tem 13 bytes pra esse comando. Se a resposta do BMS nao retornar com no minimo esse valor, algo deu errado no BMS ou na comunicação. Os valores serão descartados se isso acontecer.
  if (n < 13) {
    Serial.printf("Resposta incompleta!!");

    dados.tensao = NAN;
    dados.corrente = NAN;
    dados.porcentagem = NAN;
    
    return dados;
  }
  
  // Verifica se realmente o que veio é do BMS usando a primeira informaçao. Se ela nao for o HEADER 0x45, ta errdo.
  if (resposta[0] != 0xA5) {
    Serial.println("Pacote inválido");
    
    dados.tensao = NAN;
    dados.corrente = NAN;
    dados.porcentagem = NAN;

    return dados;
  }

  // Faz o bruto de todos os dados que precisaremos
  int tensao_bruta      = (resposta[4] << 8) | resposta[5];
  int corrente_bruta    = (resposta[6] << 8) | resposta[7];
  int porcentagem_bruta = (resposta[8] << 8) | resposta[9];

  // Faz o tratamento de todos os dados que usaremos e os assimila aos valores da estrutura com tensao, corrente e porcentagem
  dados.tensao      = tensao_bruta / 100.0;
  dados.corrente    = (corrente_bruta - 30000) / 10.0;  
  dados.porcentagem = porcentagem_bruta / 10.0;

  return dados;
}

ALERTAS_BATERIA ler_alertas_bms(){

  byte resposta[64];
  int n = 0;

  // Envio do comando pra alertas
  Serial2.write(falhas, 8);
  Serial2.flush();

  Serial.println("Comando enviado.");
  delay(10);

  // Desliga o modo de envio de dados
  digitalWrite(RS485_CONTROL, LOW);
  delay(50);

  // Lê a resposta
  while (Serial2.available() && n < 64) {
  resposta[n++] = Serial2.read();
  }

  // A resposta SEMPRE tem 13 bytes pra esse comando. Se a resposta do BMS nao retornar com no minimo esse valor, algo deu errado no BMS ou na comunicação. Os valores serão descartados se isso acontecer.
  if (n < 13) {
    Serial.printf("Resposta incompleta!!");
    return {};
  }

  // Se houver uma resposta okay, verifica se ela ta completa
  if (n < 13) {
    Serial.print("Erro no recebimento de alertas!!");
    return {};
  }

  ALERTAS_BATERIA alertas = interpretador(resposta);

  return alertas;
}

ALERTAS_BATERIA interpretador(byte resposta[13]){

  byte alerta1 = resposta[4];
  byte alerta2 = resposta[5];

  // Inicializa todos os alertas dentro da struct como falsos
  ALERTAS_BATERIA alertas = {};
  
  if (alerta1 == 0 && alerta2 == 0){
    Serial.println("Nenhum erro detectado!");
    return alertas;
  }

  // Erros nas celulas:
  alertas.celula_sobretensao = (alerta1 & (1 << 0)) != 0;
  alertas.celula_subtensao   = (alerta1 & (1 << 1)) != 0;

  // Erros nos packs
  alertas.pack_sobretensao   = (alerta1 & (1 << 2)) != 0;
  alertas.pack_subtensao     = (alerta1 & (1 << 3)) != 0;

  // Erros de temperatura
  alertas.temp_carga_alta    = (alerta1 & (1 << 4)) != 0;
  alertas.temp_carga_baixa   = (alerta1 & (1 << 5)) != 0;
  alertas.temp_descarga_alta = (alerta1 & (1 << 6)) != 0;
  alertas.mosfet_temp_alta   = (alerta1 & (1 << 7)) != 0;
  
  // Erros mais gerais 
  alertas.corrente_carga_alta    = (alerta2 & (1 << 0)) != 0;
  alertas.corrente_descarga_alta = (alerta2 & (1 << 1)) != 0;
  alertas.curto_circuito         = (alerta2 & (1 << 2)) != 0;
  alertas.mosfet_travado         = (alerta2 & (1 << 3)) != 0;

  alertas.alerta_ativo = (alertas.celula_sobretensao || alertas.celula_subtensao || alertas.corrente_carga_alta || alertas.corrente_descarga_alta || alertas.curto_circuito || alertas.mosfet_temp_alta || alertas.mosfet_travado || alertas.pack_sobretensao || alertas.pack_subtensao || alertas.temp_carga_alta || alertas.temp_carga_baixa || alertas.temp_descarga_alta);
    
  return alertas;
}

void conectar_wifi(const char *nome_rede, const char *senha){

    // Conectar ao Wi-Fi
    WiFi.begin(nome_rede, senha);

    Serial.print("Conectando");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWiFi conectado!");
}

void enviar_dados_bateria(DADOS_BATERIA dados){
    
    // Cria o client HTTP
    HTTPClient http;
    
    // Inicia uma conexão com o backend usando a URL da rota do envio de dados (POST)
    http.begin(Url_dados);

    // Informa que os dados passados serão do tipo 'json'
    http.addHeader(
        "contenty-Type",
        "application/json"
    );

    // Cria o json "cru", responsavel por, inicialmente, fazer o que sera enviado
    StaticJsonDocument<200> json_cru;

    // Insere, no arquivo "cru", os valores de tensao, corrente e porcentagem nas suas devidas colunas
    json_cru["tensao"]      = dados.tensao;
    json_cru["corrente"]    = dados.corrente;
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

void enviar_alertas_bateria(ALERTAS_BATERIA alertas){
    
    if (!alertas.alerta_ativo) return;
    
    String json_refinado = retornar_alertas(alertas);
    
    
    HTTPClient http;

    http.begin(Url_alertas);

    http.addHeader(
        "Content-Type",
        "application/json"
    );
    
    int codigo_resposta_http = http.POST(json_refinado);

    Serial.print("Tentativa de envio: ");
    Serial.println(json_refinado);
    Serial.print("Codigo de resposta: ");
    Serial.println(codigo_resposta_http);
    Serial.println("");  

    http.end();
}

String retornar_alertas(ALERTAS_BATERIA alertas){

    // Cria o arquivo json cru pra colocar as coisas
    StaticJsonDocument<200> doc;

    JsonArray erros = doc.createNestedArray("codigos");

    if (alertas.celula_sobretensao      == true) erros.add(1);
    if (alertas.celula_subtensao        == true) erros.add(2);
    if (alertas.pack_sobretensao        == true) erros.add(3);
    if (alertas.pack_subtensao          == true) erros.add(4);
    if (alertas.temp_carga_alta         == true) erros.add(5);
    if (alertas.temp_carga_baixa        == true) erros.add(6);
    if (alertas.temp_descarga_alta      == true) erros.add(7);
    if (alertas.mosfet_temp_alta        == true) erros.add(8);
    if (alertas.corrente_carga_alta     == true) erros.add(9);
    if (alertas.corrente_descarga_alta  == true) erros.add(10);
    if (alertas.curto_circuito          == true) erros.add(11);
    if (alertas.mosfet_travado          == true) erros.add(12);

    String json_refinado;
    serializeJson(doc, json_refinado);

    return json_refinado;
}

