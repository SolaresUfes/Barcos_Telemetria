#include "RECEPTOR.h"

static int ultimoRSSI = 0;

// ---- AUX: borda de subida = módulo livre (terminou de despejar o pacote na UART) ----
static volatile uint32_t tRise = 0;
static volatile bool roseFlag = false;

void IRAM_ATTR isrAux() {
  tRise = micros();
  roseFlag = true;
}

// ---- Estratégias: atraso (em µs) depois do AUX subir, antes de pedir o RSSI ----
static const int N_EST = 6;
static const uint32_t ATRASO_US[N_EST] = {5000, 10000, 20000, 30000, 50000, 80000};

// -1 = varre todas e imprime a tabela. Depois do teste, coloque o índice vencedor (0 a 5).
static const int ESTRATEGIA_FIXA = -1;

static uint16_t tentativas[N_EST] = {0};
static uint16_t acertos[N_EST]    = {0};
static uint32_t contPacotes = 0;

static const uint8_t CMD_RSSI[6] = {0xC0, 0xC1, 0xC2, 0xC3, 0x00, 0x02};

void LORA_iniciar_modulo_receptor(){
  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_RECEPTOR, TX_RECEPTOR);

  // O pino é configurado pelo helper (idempotente) ANTES do attachInterrupt, para que
  // nenhum pinMode() posterior (ex.: dentro de LORA_configurar_modulo) desfaça a ISR.
  LORA_iniciar_aux(AUX_RECEPTOR);
  attachInterrupt(digitalPinToInterrupt(AUX_RECEPTOR), isrAux, RISING);

  Serial.println("\n=========================================");
  Serial.println("[BASE - ESP32] RECEPTOR INICIADO (com AUX)");
  Serial.println("=========================================");
  Serial.println("Aguardando telemetria do barco...\n");
}

// Procura C1 00 02 <ruído> <rssi>. Só aceita RSSI plausível (-125 a -20 dBm).
static bool acharFrame(const uint8_t* b, size_t n, int& rssi, int& ruido) {
  for (size_t i = 0; i + 5 <= n; i++) {
    if (b[i] == 0xC1 && b[i+1] == 0x00 && b[i+2] == 0x02) {
      ruido = (int)b[i+3] - 256;
      int v = (int)b[i+4] - 256;
      if (b[i+4] == 0 || v > -20 || v < -125) return false;
      rssi = v;
      return true;
    }
  }
  return false;
}

void LORA_printar_pacote() {
  if (!Serial2.available()) return;

  int est = (ESTRATEGIA_FIXA >= 0) ? ESTRATEGIA_FIXA : (int)(contPacotes % N_EST);
  contPacotes++;

  roseFlag = false;

  // 1) Lê o pacote até o AUX subir (módulo terminou de despejar na UART)
  uint8_t buf[160];
  size_t total = 0;
  unsigned long t0 = millis();
  while (total < sizeof(buf) && (millis() - t0) < 300) {
    if (Serial2.available()) buf[total++] = Serial2.read();
    else if (roseFlag) break;
  }
  bool auxOk = roseFlag;

  // 2) Espera o atraso da estratégia, contado a partir da subida do AUX
  if (auxOk) {
    uint32_t alvo = tRise + ATRASO_US[est];
    while ((int32_t)(micros() - alvo) < 0) { }
  }

  // 3) Limpa a UART e pede o RSSI
  while (Serial2.available()) Serial2.read();
  Serial2.write(CMD_RSSI, sizeof(CMD_RSSI));
  Serial2.flush();

  uint8_t r[16];
  size_t n = 0;
  unsigned long t1 = millis();
  while ((millis() - t1) < 40 && n < sizeof(r)) {
    if (Serial2.available()) r[n++] = Serial2.read();
  }

  int rssi = 0, ruido = 0;
  bool ok = acharFrame(r, n, rssi, ruido);

  // 4) Texto do pacote
  String texto = "";
  for (size_t i = 0; i < total; i++)
    if (buf[i] >= 32 && buf[i] <= 126) texto += (char)buf[i];
  if (texto.length() == 0) return;

  tentativas[est]++;
  if (ok) { acertos[est]++; ultimoRSSI = rssi; }

  Serial.print(">> CHEGOU: ");
  Serial.print(texto);
  if (ok) Serial.printf(" | RSSI %d dBm (ruido %d) [est %d]\n", rssi, ruido, est);
  else    Serial.printf(" | sem leitura [est %d%s]\n", est, auxOk ? "" : ", AUX nao subiu!");

  // 5) Tabela de acertos a cada 4 voltas completas
  if (ESTRATEGIA_FIXA < 0 && contPacotes % (N_EST * 4) == 0) {
    Serial.println("--- acertos por estrategia ---");
    for (int i = 0; i < N_EST; i++) {
      Serial.printf("est %d (atraso %lu us): %u/%u\n",
                    i, (unsigned long)ATRASO_US[i], acertos[i], tentativas[i]);
    }
    Serial.println("------------------------------");
  }
}

int lerIntensidadePacote() {
  int r = ultimoRSSI;
  ultimoRSSI = 0;   // só devolve valor novo uma vez
  return r;
}
