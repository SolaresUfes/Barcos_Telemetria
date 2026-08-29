// #include <WiFi.h>
// #include <HTTPClient.h>
// #include <ArduinoJson.h>

// // Dados pra conexão WiFi
// const char* ssid = "Francisco";
// const char* password = "Fr@ncisco2025";

// // Dados pra conexão com o backend
// // Para conexão, colocamos o endereço do cmoputador rodando o back. No caso, o meu
// const char* Url_envio_sensores = "http://192.168.1.9:3000/api/sensores";

// void setup() {

//   Serial.begin(115200);

//   // Conectar ao Wi-Fi
//   WiFi.begin(ssid, password);

//   Serial.print("Conectando");

//   while (WiFi.status() != WL_CONNECTED) {
//     delay(500);
//     Serial.print(".");
//   }

//   Serial.println("\nWiFi conectado!");
// }

// void loop() {

//   // Só envia se estiver conectado
//   if (WiFi.status() == WL_CONNECTED) {

//     // Cria um client http
//     HTTPClient http;

//     // Inicia conexão com o backend usando a rota de envio de dados dos sensores
//     http.begin(Url_envio_sensores);

//     // Header do tipo JSON
//     http.addHeader(
//       "Content-Type",
//       "application/json"
//     );

//     // Cria um arquivo "cru" de json
//     StaticJsonDocument<200> json;

//     // Exemplos de valores
//     float tensao = 12.4;
//     float corrente = 3.1;

//     // Adiciona as colunas 'tensao' e 'corrente' os valores das variaveis de teste que colocamos anteriormente
//     json["tensao"] = tensao;
//     json["corrente"] = corrente;

//     // Cria uma string pra podermos estilizar
//     String corpoJson;
//     // Usamos a string pra receber os valores do arquivo cru JSON e deixar formatado de uma forma que as coisas sejam entendidas entre supabase, back e esp
//     serializeJson(json, corpoJson);

//     Serial.print("Enviando: ");
//     Serial.println(corpoJson);

//     // Envia os dados via http e coloca a resposta na variavel 'httpResponseCode'
//     int httpResponseCode = http.POST(corpoJson);

//     Serial.print("HTTP code: ");
//     Serial.println(httpResponseCode);

//     // Ler resposta do backend
//     String resposta = http.getString();

//     Serial.print("Resposta: ");
//     Serial.println(resposta);

//     http.end();
//   }

//   delay(2000);
// }