// #include <Arduino.h>

// #define RXD2 16
// #define TXD2 17
// #define RS485_CONTROL 4

// // Struct que compreende os dados da bateria que iremos pegar. Pode-se adicionar mais dados aqui com o passar do tempo.
// struct DADOS_BATERIA {
//   float tensao;
//   float corrente;
//   float porcentagem;
// };

// struct ALERTAS_BATERIA {
//   bool celula_sobretensao;
//   bool celula_subtensao;

//   bool pack_sobretensao;
//   bool pack_subtensao;

//   bool temp_carga_alta;
//   bool temp_carga_baixa;
//   bool temp_descarga_alta;
//   bool mosfet_temp_alta;

//   bool corrente_carga_alta;
//   bool corrente_descarga_alta;
//   bool curto_circuito;
//   bool mosfet_travado;

//   bool alerta_ativo;
// };

// // Comando geral que pode ser usado para tensao, corrente e porcentagem
// byte status_geral[]    = {0xA5, 0x40, 0x90, 0x08, 0x00, 0x00, 0x00, 0x7D}; // 381 -> 125 = 0x7D
// byte falhas[]          = {0xA5, 0x40, 0x95, 0x08, 0x00, 0x00, 0x00, 0x82}; // 386 -> 130 = 0x82

// // Comandos usam uma sequencia definida como:
// /*
//   [0] 0xA5   → Iniciador
//   [1] 0x40   → Endereço de quem esta sendo acessado (O Daly pode ser um pouco diferente, como: 0x01, 0x40 ou 0x80)
//   [2] CMD    → Comando
//   [3] 0x08   → Tamanho da mensagem. Nesse caso, temos uma mensagem com tamanho 8
//   [4] 0x00
//   [5] 0x00
//   [6] 0x00
//   [7] Checksum -> (byte0 + byte1 + ... + byte6) & 0xFF -> Descarta quaisquer informaçoes acima de 255...
// */

// // A resposta vem com 13 bytes e seu processamento pode ser feito nas funcoes especificas:
// /*
//   0    Start
//   1    Address
//   2    Command
//   3    Length
//   4    Data1
//   ...
//   11   Data8
//   12   Checksum

//   Cada resposta de uma "pergunta" vem com 2 bytes de informacao, logo, a resposta pra um comando tera que ser computada no formato:

//   int resposta_pra_algo = (array_resposta[n] << 8) | array_resposta[n+1];
  
//   Onde o n sera o byte que queremos analisar. Para cada comando, o byte pode mudar, entao o codigo nao tem somente um valor pra "n"
//   */
 
// DADOS_BATERIA ler_dados_bms();

// ALERTAS_BATERIA ler_alertas_bms();

// ALERTAS_BATERIA interpretador(byte resposta[13]);

// void setup() {
//   Serial.begin(115200);
//   Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2); // UART2
  
//   // Controle do RS485. A escrita estar em LOW / HIGH nos diz se esta em modo de leitura ou transmissao -> LOW = Modo de leitura (ou espera) / HIGH = Transmitindo dados
//   pinMode(RS485_CONTROL, OUTPUT);
//   digitalWrite(RS485_CONTROL, LOW); // Modo de espera
  
//   Serial.println("RS485 iniciado...");
// }

// void loop() {

//   // Transmissao HIGH
//   digitalWrite(RS485_CONTROL, HIGH);
//   delay(10);    
//   DADOS_BATERIA BMS_dados = ler_dados_bms();

//   digitalWrite(RS485_CONTROL, HIGH);
//   delay(10);
//   ALERTAS_BATERIA BMS_alertas = ler_alertas_bms();

//   digitalWrite(RS485_CONTROL, LOW);
  
//   delay(1000);
// }

// DADOS_BATERIA ler_dados_bms(){

//   byte resposta[64];
//   int n = 0;

//   DADOS_BATERIA dados;

//   Serial2.write(status_geral, 8);
//   Serial2.flush();

//   Serial.println("Comandos enviados!");
//   delay(10);

//   // Ativa o modo de recepção de dados
//   digitalWrite(RS485_CONTROL, LOW);
//   delay(50);
  
//   // Leitura da resposta bit a bit
//   while (Serial2.available() && n < 64) {
//     resposta[n++] = Serial2.read();
//   }

//   // A resposta SEMPRE tem 13 bytes pra esse comando. Se a resposta do BMS nao retornar com no minimo esse valor, algo deu errado no BMS ou na comunicação. Os valores serão descartados se isso acontecer.
//   if (n < 13) {
//     Serial.printf("Resposta incompleta!!");

//     dados.tensao = NAN;
//     dados.corrente = NAN;
//     dados.porcentagem = NAN;
    
//     return dados;
//   }
  
//   // Verifica se realmente o que veio é do BMS usando a primeira informaçao. Se ela nao for o HEADER 0x45, ta errdo.
//   if (resposta[0] != 0xA5) {
//     Serial.println("Pacote inválido");
    
//     dados.tensao = NAN;
//     dados.corrente = NAN;
//     dados.porcentagem = NAN;

//     return dados;
//   }

//   // Faz o bruto de todos os dados que precisaremos
//   int tensao_bruta      = (resposta[4] << 8) | resposta[5];
//   int corrente_bruta    = (resposta[6] << 8) | resposta[7];
//   int porcentagem_bruta = (resposta[8] << 8) | resposta[9];

//   // Faz o tratamento de todos os dados que usaremos e os assimila aos valores da estrutura com tensao, corrente e porcentagem
//   dados.tensao      = tensao_bruta / 100.0;
//   dados.corrente    = (corrente_bruta - 30000) / 10.0;  
//   dados.porcentagem = porcentagem_bruta / 10.0;

//   return dados;
// }

// ALERTAS_BATERIA ler_alertas_bms(){

//   byte resposta[64];
//   int n = 0;

//   // Envio do comando pra alertas
//   Serial2.write(falhas, 8);
//   Serial2.flush();

//   Serial.println("Comando enviado.");
//   delay(10);

//   // Desliga o modo de envio de dados
//   digitalWrite(RS485_CONTROL, LOW);
//   delay(50);

//   // Lê a resposta
//   while (Serial2.available() && n < 64) {
//   resposta[n++] = Serial2.read();
//   }

//   // A resposta SEMPRE tem 13 bytes pra esse comando. Se a resposta do BMS nao retornar com no minimo esse valor, algo deu errado no BMS ou na comunicação. Os valores serão descartados se isso acontecer.
//   if (n < 13) {
//     Serial.printf("Resposta incompleta!!");
//     return {};
//   }

//   // Se houver uma resposta okay, verifica se ela ta completa
//   if (n < 13) {
//     Serial.print("Erro no recebimento de alertas!!");
//     return {};
//   }

//   ALERTAS_BATERIA alertas = interpretador(resposta);

//   return alertas;
// }

// ALERTAS_BATERIA interpretador(byte resposta[13]){

//   byte alerta1 = resposta[4];
//   byte alerta2 = resposta[5];

//   // Inicializa todos os alertas dentro da struct como falsos
//   ALERTAS_BATERIA alertas = {};
  
//   if (alerta1 == 0 && alerta2 == 0){
//     Serial.println("Nenhum erro detectado!");
//     return alertas;
//   }

//   // Erros nas celulas:
//   alertas.celula_sobretensao = (alerta1 & (1 << 0)) != 0;
//   alertas.celula_subtensao   = (alerta1 & (1 << 1)) != 0;

//   // Erros nos packs
//   alertas.pack_sobretensao   = (alerta1 & (1 << 2)) != 0;
//   alertas.pack_subtensao     = (alerta1 & (1 << 3)) != 0;

//   // Erros de temperatura
//   alertas.temp_carga_alta    = (alerta1 & (1 << 4)) != 0;
//   alertas.temp_carga_baixa   = (alerta1 & (1 << 5)) != 0;
//   alertas.temp_descarga_alta = (alerta1 & (1 << 6)) != 0;
//   alertas.mosfet_temp_alta   = (alerta1 & (1 << 7)) != 0;
  
//   // Erros mais gerais 
//   alertas.corrente_carga_alta    = (alerta2 & (1 << 0)) != 0;
//   alertas.corrente_descarga_alta = (alerta2 & (1 << 1)) != 0;
//   alertas.curto_circuito         = (alerta2 & (1 << 2)) != 0;
//   alertas.mosfet_travado         = (alerta2 & (1 << 3)) != 0;

//   alertas.alerta_ativo = (alertas.celula_sobretensao || alertas.celula_subtensao || alertas.corrente_carga_alta || alertas.corrente_descarga_alta || alertas.curto_circuito || alertas.mosfet_temp_alta || alertas.mosfet_travado || alertas.pack_sobretensao || alertas.pack_subtensao || alertas.temp_carga_alta || alertas.temp_carga_baixa || alertas.temp_descarga_alta);
    
//   return alertas;
// }