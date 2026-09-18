#include "NOW.h"


// ===============Funções auxiliares===============

// Substitua o retorno pela leitura real da bateria do barco.
static float ler_bateria_barco_percentual()
{
  return rand()%101;
}

// Substitua o retorno pela leitura real do sensor de corrente.
static float ler_corrente_amperes()
{
  return (((float)rand()/RAND_MAX)*120.0);
}

// Conecta brevemente ao roteador apenas para descobrir o canal de rádio.
static uint8_t descobrir_canal_do_display()
{
  Serial.printf("Procurando a rede %s para descobrir o canal...\n", NOME_REDE_WIFI);
  WiFi.begin(NOME_REDE_WIFI, SENHA_REDE_WIFI);

  const uint32_t inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 15000) {
    delay(100);
  }

  uint8_t canal = CANAL_ESPNOW_RESERVA;
  if (WiFi.status() == WL_CONNECTED) {
    canal = WiFi.channel();
    Serial.printf("Canal encontrado: %u.\n", canal);
  } else {
    Serial.printf("Rede não encontrada. Usando o canal reserva %u.\n", canal);
  }

  // Mantém o rádio ligado para o ESP-NOW, mas encerra a conexão com o roteador.
  WiFi.disconnect(false, false);
  delay(100);
  return canal;
}

static bool iniciar_espnow()
{
  WiFi.mode(WIFI_STA);
  canal_espnow = descobrir_canal_do_display();

  if (esp_wifi_set_channel(canal_espnow, WIFI_SECOND_CHAN_NONE) != ESP_OK) {
    Serial.println("Falha ao selecionar o canal do ESP-NOW.");
    return false;
  }

  if (esp_now_init() != ESP_OK) {
    Serial.println("Falha ao iniciar o ESP-NOW.");
    return false;
  }

  esp_now_peer_info_t destino = {};
  memcpy(destino.peer_addr, ENDERECO_BROADCAST, sizeof(ENDERECO_BROADCAST));
  destino.channel = canal_espnow;
  destino.ifidx = WIFI_IF_STA;
  destino.encrypt = false;

  if (esp_now_add_peer(&destino) != ESP_OK) {
    Serial.println("Falha ao cadastrar o endereço de broadcast.");
    esp_now_deinit();
    return false;
  }

  Serial.printf("ESP-NOW pronto no canal %u.\n", canal_espnow);
  Serial.print("MAC deste transmissor: ");
  Serial.println(WiFi.macAddress());
  return true;
}

static void enviar_telemetria()
{
  PacoteTelemetriaEspNow pacote = {};
  pacote.versao = VERSAO_PACOTE_TELEMETRIA;
  pacote.tamanho = sizeof(PacoteTelemetriaEspNow);
  pacote.sequencia = proxima_sequencia++;
  pacote.bateria_barco_percentual = constrain(
    ler_bateria_barco_percentual(), 0.0f, 100.0f
  );
  pacote.corrente_amperes = ler_corrente_amperes();

  const esp_err_t resultado = esp_now_send(
    ENDERECO_BROADCAST,
    reinterpret_cast<const uint8_t *>(&pacote),
    sizeof(pacote)
  );

  if (resultado == ESP_OK) {
    Serial.printf(
      "Pacote %lu enviado: bateria %.1f%%, corrente %.2f A.\n",
      static_cast<unsigned long>(pacote.sequencia),
      pacote.bateria_barco_percentual,
      pacote.corrente_amperes
    );
  } else {
    Serial.printf("Falha imediata no envio: %s.\n", esp_err_to_name(resultado));
  }
}

void setup()
{
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("Transmissor de telemetria Solares iniciando.");

  espnow_pronto = iniciar_espnow();
  if (!espnow_pronto) {
    Serial.println("Inicialização interrompida. Reinicie a placa para tentar novamente.");
    return;
  }

  // Permite que o primeiro pacote seja enviado imediatamente.
  ultimo_envio_ms = millis() - INTERVALO_ENVIO_MS;
}

void loop()
{
  if (!espnow_pronto) {
    delay(1000);
    return;
  }

  const uint32_t agora = millis();
  if (agora - ultimo_envio_ms >= INTERVALO_ENVIO_MS) {
    ultimo_envio_ms = agora;
    enviar_telemetria();
  }

  // Pequena pausa reduz o uso de processador sem afetar o intervalo de um segundo.
  delay(5);
}
