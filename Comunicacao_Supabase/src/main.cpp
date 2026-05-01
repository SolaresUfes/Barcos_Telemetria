#include <Arduino.h>
#include <WiFi.h>         // Biblioteca pra WiFi
# include <HTTPClient.h>  // Bivlioteca pra usar protocolo HTTP
#include <ArduinoJson.h>

// Inicia as configurações de rede WiFi. Nome da rede e senha devem ser colocadas aqui.
const char* nome_rede  = "aaa";
const char* senha_rede = "abcdefgh";

// Inicia as configurações pro supabase. Chave anonima e url. Na url que colocamos qual a tabela que vamos mexer.
// "https://lnlvfdpkkmneypmdwqta.supabase.co/rest/v1/ (. . .) " --> O "(. . .)" é o nome da tabela. O nome deve ser LITERAL.
const char* url_supabase = "https://lnlvfdpkkmneypmdwqta.supabase.co/rest/v1/Teste";
const char* anon_key     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubHZmZHBra21uZXlwbWR3cXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDMxMzIsImV4cCI6MjA4ODcxOTEzMn0.jaqG2b6eBeSAwlwiDsCZnikoBtX3BOWNTVyppigVqBU"; 

void setup() {
  Serial.begin(115200);

  // Inicia o WiFi na placa com a rede e senha escolhidos
  WiFi.begin(nome_rede, senha_rede);

  // Garante a conexão do ESP ao WiFi antes de continuar
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.println("   Conectando . . .");
    Serial.println(WiFi.status());
  }

  Serial.println("WiFi conectado!");
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    // Inicia o protocolo HTTP / Cria a conexão com o supabase pela url do projeto
    HTTPClient http;
    http.begin(url_supabase);


    // --> Headers obrigatórios

    // Define o tipo de conteúdo enviado como json
    http.addHeader("Content-Type", "application/json");
    // Define a chave da api
    http.addHeader("apikey", anon_key);
    // Autentica a comunicação. Aumenta a seegurança fazendo como que um "aperto de mão" usando a chave da api
    http.addHeader("Authorization", String("Bearer ") + anon_key);
    // Diz pra retornar o mínimo de coisa prssível. Usaremos isso, pois o ESP só vai enviar coisas e não precisa gastar com receber muitas respostas.
    http.addHeader("Prefer", "return=minimal");

    // Cria uma variável estática pra manter seu valor sempre que o codigo terminar e nao precisar ser começada do 0 
    static int valor = 0;

    // --> Duas formas de fazer a string em json sem usar a biblioteca (na mão):
    /* String json = "{\"Valor\": " + String(valor++) + "}"; */
    /*String json = "{";
          json += "\"Valor\":";
          json += String(valor++);
          json += "}";
    "{Valor: valor}"*/

    // Vamos usar a biblioteca pra json pra ficar melhor de fazer as coisas
    // Criar um container com os dados necessarios
    StaticJsonDocument<200> valor_bruto;

    // Adicionar valores a essa coisa
    valor_bruto["valores_teste"] = (valor++);

    // Criar a variavel string que sera mandada / Jogar de json pra string usavel pelo método "POST"
    String json;
    serializeJson(valor_bruto, json);


    // "http.POST()" é a funcao que envia os dados (POST) pro supabsae. Ela retorna um valor que pode  variar dependendo do retorno
    // "int" foi criada pra receber o tal codigo. Entre eles: 201 (Sucesso), 401 (Erro de chave), 404 (Erro de URL)
    int codigo_retorno = http.POST(json);

    Serial.print("Enviado: ");
    Serial.println(valor);
    Serial.print("Código de retorno: ");
    Serial.println(codigo_retorno);

    // Termina o processo de envio do(s) dado(s)
    http.end();
    
  }

  // Ocorre a cada segundo
  delay(1000);

}
