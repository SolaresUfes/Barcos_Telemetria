#include "Backend.h"

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>

// ----------------- VARIAVEIS E CONSTANTES -----------------

// Dados pra conexão WiFi
const char *ssid = "aaa";
const char *password = "12345678";

// Dados pra conexão com o backend
// Para conexão, colocamos o endereço do backend rodando no vercel
const char *Url_dados = "https://painel-f8r7.vercel.app/api/sensores";
const char *Url_alertas = "https://painel-f8r7.vercel.app/api/alertas";
const char *Url_celulas = "https://painel-f8r7.vercel.app/api/celulas";


// ----------------- FUNÇÕES -----------------

void conectar_wifi(){

    // A ideia é tentar por pouco tempo e depois desistir da conexão. Isso é melhor do que so deixar o codigo preso num loop infinito pra tentar conectar em algo que nao vai conectar
    if (WiFi.status() == WL_CONNECTED)
        return;

    Serial.println("Tentando conectar ao Wi-Fi...");

    WiFi.begin(ssid, password);

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

void enviar_dados_bateria(DADOS_BATERIA dados){

    // Nao tenta enviar se nao tiver internet (evita travamento do ESP32)
    if (WiFi.status() != WL_CONNECTED) conectar_wifi(ssid, password);

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

void enviar_alertas_bateria(ALERTAS_BATERIA alertas){

    // Nao tenta enviar se nao tiver internet (evita travamento do ESP32)
    if (WiFi.status() != WL_CONNECTED) conectar_wifi(ssid, password);

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

void enviar_dados_celulas(CELULAS_INDIVIDUAIS dados){
    
  // Não tenta enviar se não tiver internet
    if (WiFi.status() != WL_CONNECTED) conectar_wifi(ssid, password);

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

String retornar_alertas(ALERTAS_BATERIA alertas){

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
