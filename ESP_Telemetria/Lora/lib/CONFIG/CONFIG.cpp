#include "CONFIG.h"

// ============================================================================
// SEÇÃO 1: FUNÇÕES AUXILIARES PRIVADAS (namespace anônimo)
// ============================================================================
// Em C++, tudo o que fica dentro de um "namespace { ... }" sem nome só pode ser
// enxergado dentro deste arquivo (.cpp). Isso evita poluir o autocompletar do
// projeto e impede conflitos de nomes com as pastas EMISSOR e RECEPTOR.
namespace {

// Tempo máximo (em milissegundos) que o ESP32 espera por uma resposta do LoRa
constexpr uint32_t UART_TIMEOUT_MS = 1000;

/**
 * Descarta qualquer byte residual ou ruído elétrico acumulado no buffer RX
 * antes de enviar um novo comando ao módulo.
 */
void limparBufferSerial(HardwareSerial& serial) {
  delay(20); // Pequena pausa para garantir que eventuais bytes em trânsito cheguem
  while (serial.available() > 0) {
    serial.read(); // Lê e joga fora
  }
}

/**
 * Monta o byte REG0 (Registrador 02H) empacotando 3 configurações em 8 bits:
 *
 *   Bits [7:5] -> uartBaud    (3 bits: velocidade da serial UART)
 *   Bits [4:3] -> uartParity  (2 bits: paridade 8N1, 8O1, 8E1)
 *   Bits [2:0] -> airDataRate (3 bits: velocidade de transmissão pelo ar)
 *
 * Operadores usados:
 *   - static_cast<uint8_t>(...): converte o enum class para número inteiro de 1 byte.
 *   - << (deslocamento à esquerda): empurra os bits para a posição correta no byte.
 *   - |  (OU bit a bit): junta os pedaços sem sobrescrever os bits vizinhos.
 */
uint8_t montarReg0(const LoRaConfig& cfg) {
  return (static_cast<uint8_t>(cfg.uartBaud) << 5) |
         (static_cast<uint8_t>(cfg.uartParity) << 3) |
         static_cast<uint8_t>(cfg.airDataRate);
}

/**
 * Monta o byte REG1 (Registrador 03H) empacotando 3 configurações em 8 bits:
 *
 *   Bits [7:6] -> packetSize        (2 bits: tamanho do sub-pacote: 200, 128, 64 ou 32B)
 *   Bit  [5]   -> enableAmbientRssi (1 bit:  habilita leitura de ruído ambiente)
 *   Bits [4:2] -> Reservado         (3 bits: sempre 000 conforme datasheet)
 *   Bits [1:0] -> txPower           (2 bits: potência de transmissão RF)
 */
uint8_t montarReg1(const LoRaConfig& cfg) {
  return (static_cast<uint8_t>(cfg.packetSize) << 6) |
         ((cfg.enableAmbientRssi ? 1U : 0U) << 5) |
         static_cast<uint8_t>(cfg.txPower);
}

/**
 * Monta o byte REG3 (Registrador 05H) com as opções avançadas de rádio:
 *
 *   Bit  [7]   -> enablePacketRssi  (anexa byte de força de sinal ao final do pacote)
 *   Bit  [6]   -> fixedTransmission (0 = Modo Transparente, 1 = Modo Ponto-a-Ponto Fixo)
 *   Bit  [5]   -> Reservado         (sempre 0)
 *   Bit  [4]   -> enableLbt         (Listen Before Talk: escuta antes de transmitir)
 *   Bit  [3]   -> worTransmitter    (define se atua como transmissor Wake-on-Radio)
 *   Bits [2:0] -> worCycle          (intervalo de despertar no modo economia de energia)
 */
uint8_t montarReg3(const LoRaConfig& cfg) {
  return ((cfg.enablePacketRssi ? 1U : 0U) << 7) |
         ((cfg.fixedTransmission ? 1U : 0U) << 6) |
         ((cfg.enableLbt ? 1U : 0U) << 4) |
         ((cfg.worTransmitter ? 1U : 0U) << 3) |
         static_cast<uint8_t>(cfg.worCycle);
}

/**
 * Imprime um vetor de bytes em formato hexadecimal legível (ex: "C0 00 08 ...").
 * Adiciona um zero à esquerda para valores menores que 0x10 (ex: imprime "03" em vez de "3").
 */
void imprimirHexBuffer(const uint8_t* buffer, size_t tamanho) {
  for (size_t i = 0; i < tamanho; i++) {
    if (buffer[i] < 0x10) Serial.print("0");
    Serial.print(buffer[i], HEX);
    Serial.print(" ");
  }
  Serial.println();
}

/**
 * Lê a resposta da serial usando uma "janela deslizante" de timeout:
 * - Espera até `timeoutMs` pelo primeiro byte chegar.
 * - A cada byte recebido, reinicia o cronômetro (`inicio = millis()`).
 * - Isso garante que o ESP32 leia todo o pacote sem ficar travado esperando o tempo
 *   total caso o rádio responda rápido.
 */
size_t lerRespostaUart(HardwareSerial& serial, uint8_t* buffer, size_t maxLen, uint32_t timeoutMs) {
  size_t lidos = 0;
  unsigned long inicio = millis();

  while ((millis() - inicio) < timeoutMs && lidos < maxLen) {
    if (serial.available() > 0) {
      buffer[lidos++] = static_cast<uint8_t>(serial.read());
      inicio = millis(); // Reinicia a contagem enquanto continuarem chegando bytes
    }
  }
  return lidos;
}

} // namespace


// ============================================================================
// SEÇÃO 2: PINO AUX E CONTROLE FÍSICO DOS PINOS DE MODO (M0 e M1)
// ============================================================================

/**
 * Configura o pino AUX como entrada, uma única vez por GPIO.
 *
 * Usa INPUT_PULLUP: o AUX do módulo é uma saída ativa, então o pull-up não interfere
 * quando o fio está ligado. Se o fio soltar, o pino fica em ALTO (= "livre") em vez de
 * flutuar e gerar leituras aleatórias.
 *
 * O controle por "uma vez só" existe porque, no ESP32, reconfigurar o pino com pinMode()
 * depois de um attachInterrupt() pode desfazer a interrupção (o RECEPTOR usa o AUX em ISR).
 * Aceita GPIOs de 0 a 63 (o ESP32-S3 vai até o 48).
 */
void LORA_iniciar_aux(uint8_t pinoAux) {
  static uint64_t iniciados = 0;
  const uint64_t bit = 1ULL << pinoAux;
  if (iniciados & bit) return;

  pinMode(pinoAux, INPUT_PULLUP);
  iniciados |= bit;
}

/**
 * Espera o AUX ficar ALTO (módulo livre: sem dados pendentes na UART, sem transmissão
 * em curso, sem autoteste/reset). Retorna true se ficou livre dentro do timeout.
 */
bool LORA_aguardar_aux_livre(uint8_t pinoAux, uint32_t timeoutMs) {
  LORA_iniciar_aux(pinoAux);

  const unsigned long inicio = millis();
  while (digitalRead(pinoAux) == LOW) {
    if ((millis() - inicio) >= timeoutMs) return false;
    yield();
  }
  return true;
}

/**
 * Configura os pinos M0 e M1 do ESP32 como saídas digitais (e o AUX como entrada).
 * Os números dos pinos vêm de `include/Config_defs.h` (M0_CONFIG, M1_CONFIG e AUX_CONFIG).
 */
void LORA_iniciar_pinos_config() {
  pinMode(M0_CONFIG, OUTPUT);
  pinMode(M1_CONFIG, OUTPUT);
  LORA_iniciar_aux(AUX_CONFIG);
}

/**
 * Alterna o estado lógico dos pinos M0 e M1 para colocar o módulo LoRa
 * em um dos 4 modos de operação previstos no datasheet:
 *
 *   Modo 0 (Normal):      M0 = LOW,  M1 = LOW  -> Envia e recebe dados pela antena.
 *   Modo 1 (WorTransmit): M0 = HIGH, M1 = LOW  -> Envia preâmbulo longo para acordar receptores.
 *   Modo 2 (WorReceive):  M0 = LOW,  M1 = HIGH -> Fica dormindo e acorda periodicamente.
 *   Modo 3 (ConfigSleep): M0 = HIGH, M1 = HIGH -> Desliga o rádio RF e libera configuração via UART.
 *
 * A troca é guiada pelo pino AUX:
 *   1) só mexe em M0/M1 quando o AUX está ALTO (módulo ocioso, sem nada a meio caminho);
 *   2) depois da troca o módulo derruba o AUX enquanto reinicializa e o sobe de novo quando
 *      está pronto, então espera o AUX voltar a ALTO antes de devolver o controle.
 * Se o AUX não responder (fio solto, soldagem ruim), cai no atraso fixo antigo de 50 ms.
 */
void LORA_definir_modo(LoRaOperatingMode modo) {
  LORA_iniciar_pinos_config();

  // 1) Antes: o módulo precisa estar livre para aceitar a troca de modo.
  if (!LORA_aguardar_aux_livre(AUX_CONFIG, AUX_TIMEOUT_MODO_MS)) {
    Serial.println("[AVISO] AUX nao ficou livre antes da troca de modo (fio solto?).");
  }

  switch (modo) {
    case LoRaOperatingMode::Normal:
      digitalWrite(M0_CONFIG, LOW);
      digitalWrite(M1_CONFIG, LOW);
      break;
    case LoRaOperatingMode::WorTransmit:
      digitalWrite(M0_CONFIG, HIGH);
      digitalWrite(M1_CONFIG, LOW);
      break;
    case LoRaOperatingMode::WorReceive:
      digitalWrite(M0_CONFIG, LOW);
      digitalWrite(M1_CONFIG, HIGH);
      break;
    case LoRaOperatingMode::ConfigSleep:
      digitalWrite(M0_CONFIG, HIGH);
      digitalWrite(M1_CONFIG, HIGH);
      break;
  }

  // 2) Depois: dá tempo para o módulo perceber M0/M1 e derrubar o AUX, e então espera
  // ele terminar de chavear o circuito de RF e estabilizar a UART (AUX volta a ALTO).
  delay(AUX_ATRASO_TROCA_MS);
  if (LORA_aguardar_aux_livre(AUX_CONFIG, AUX_TIMEOUT_MODO_MS)) {
    delay(AUX_ATRASO_POS_MODO_MS);
  } else {
    Serial.println("[AVISO] AUX nao subiu apos a troca de modo; usando atraso fixo de 50 ms.");
    delay(50);
  }
}


// ============================================================================
// SEÇÃO 3: GRAVAÇÃO E VALIDAÇÃO DOS REGISTRADORES (00H a 07H)
// ============================================================================

/**
 * Grava todos os parâmetros da struct `LoRaConfig` no módulo LoRa e valida se
 * o hardware aceitou e salvou corretamente os valores.
 *
 * @param cfg            Struct preenchida com as configurações desejadas.
 * @param salvarNaEeprom true  -> envia comando 0xC0 (salva permanente na EEPROM).
 *                       false -> envia comando 0xC2 (salva temporário na RAM).
 * @return true se o módulo respondeu e confirmou todos os registradores; false se falhou.
 */
bool LORA_configurar_modulo(const LoRaConfig& cfg, bool salvarNaEeprom) {
  // PASSO 1: Coloca o módulo no Modo 3 (M0=1, M1=1).
  // Sem isso, o rádio ignora comandos de configuração e transmite os bytes pelo ar.
  LORA_definir_modo(LoRaOperatingMode::ConfigSleep);

  // PASSO 2: Inicia a Serial2 na taxa fixa de 9600 bps (obrigatória no Modo 3)
  // e limpa qualquer lixo elétrico acumulado na linha.
  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_CONFIG, TX_CONFIG);
  limparBufferSerial(Serial2);

  // PASSO 3: Prepara os bytes de cada registrador (00H até 07H).
  uint8_t cmdHeader = salvarNaEeprom ? 0xC0 : 0xC2;

  // Como `address` tem 16 bits (2 bytes), dividimos em Byte Alto (ADDH) e Byte Baixo (ADDL):
  uint8_t addh = static_cast<uint8_t>((cfg.address >> 8) & 0xFF); // Pega os 8 bits da esquerda
  uint8_t addl = static_cast<uint8_t>(cfg.address & 0xFF);        // Pega os 8 bits da direita

  // Empacota os registradores de configuração usando as funções auxiliares:
  uint8_t reg0 = montarReg0(cfg); // Registrador 02H: Baud, Paridade e Air Data Rate
  uint8_t reg1 = montarReg1(cfg); // Registrador 03H: Tamanho de pacote, Ruído e Potência
  uint8_t reg2 = cfg.channel;     // Registrador 04H: Canal físico (Frequência = 850.125 + canal)
  uint8_t reg3 = montarReg3(cfg); // Registrador 05H: RSSI, Modo Fixo, LBT e WOR

  // Divide a chave de criptografia (16 bits) em dois bytes (CRYPT_H e CRYPT_L):
  uint8_t cryptH = static_cast<uint8_t>((cfg.encryptionKey >> 8) & 0xFF);
  uint8_t cryptL = static_cast<uint8_t>(cfg.encryptionKey & 0xFF);

  // Monta o quadro completo de 11 bytes exigido pelo protocolo Ebyte:
  // [Cabeçalho] [Addr Inicial = 00H] [Qtd Bytes = 08H] [8 bytes de dados...]
  uint8_t comando[11] = {
    cmdHeader, 0x00, 0x08,
    addh, addl, reg0, reg1, reg2, reg3, cryptH, cryptL
  };

  Serial.println("\n=== ENVIANDO CONFIGURACAO LORA ===");
  Serial.print("Enviado (Hex):  ");
  imprimirHexBuffer(comando, sizeof(comando));

  // PASSO 4: Envia os 11 bytes e aguarda a transmissão física terminar (`flush`)
  Serial2.write(comando, sizeof(comando));
  Serial2.flush();

  // PASSO 5: Lê e audita a resposta do módulo
  uint8_t resposta[16] = {0};
  size_t bytesLidos = lerRespostaUart(Serial2, resposta, sizeof(resposta), UART_TIMEOUT_MS);

  bool sucesso = false;

  if (bytesLidos == 0) {
    Serial.println("[ERRO] Timeout: Nenhuma resposta do modulo LoRa. Verifique RX/TX e M0/M1.");
  } else {
    Serial.print("Recebido (Hex): ");
    imprimirHexBuffer(resposta, bytesLidos);

    // Quando dá certo, o módulo responde ecoando o cabeçalho 0xC1 + 0x00 + 0x08
    // seguido pelos valores que ficaram gravados nos registradores.
    if (bytesLidos >= 11 && resposta[0] == 0xC1 && resposta[1] == 0x00 && resposta[2] == 0x08) {
      // Confere byte a byte se o que o módulo gravou bate com o que enviamos.
      // Nota: os bytes 9 e 10 (CRYPT_H/L) não são comparados porque, por segurança,
      // o módulo sempre retorna 0x00 0x00 na leitura da chave de criptografia.
      bool registrosConferem =
        (resposta[3] == addh) &&
        (resposta[4] == addl) &&
        (resposta[5] == reg0) &&
        (resposta[6] == reg1) &&
        (resposta[7] == reg2) &&
        (resposta[8] == reg3);

      if (registrosConferem) {
        Serial.printf("[SUCESSO] Configuracao gravada! Canal: %u (%.3f MHz) | Endereco: 0x%04X\n",
                      reg2, 850.125f + reg2, cfg.address);
        sucesso = true;
      } else {
        Serial.println("[ERRO] Resposta recebida, mas os valores dos registradores divergem.");
      }
    } else if (bytesLidos >= 3 && resposta[0] == 0xFF && resposta[1] == 0xFF && resposta[2] == 0xFF) {
      // O código 0xFF 0xFF 0xFF é o aviso padrão do chip para comando mal formatado
      Serial.println("[ERRO] Modulo retornou 0xFF 0xFF 0xFF (Formato de comando invalido).");
    } else {
      Serial.println("[ERRO] Resposta inesperada do modulo.");
    }
  }

  // PASSO 6: Devolve o módulo ao Modo Normal (M0=0, M1=0) para deixá-lo pronto
  // para transmitir/receber telemetria logo após a configuração.
  LORA_definir_modo(LoRaOperatingMode::Normal);
  return sucesso;
}


// ============================================================================
// SEÇÃO 4: LEITURA E DIAGNÓSTICO DO MÓDULO (SEM ALTERAR CONFIGURAÇÃO)
// ============================================================================

/**
 * Consulta os 8 registradores atuais do módulo LoRa e imprime no Monitor Serial
 * os valores decodificados (endereço, frequência em MHz e flags ativadas).
 */
bool LORA_ler_configuracao() {
  LORA_definir_modo(LoRaOperatingMode::ConfigSleep);
  return false; // Temporário até implementar a leitura dos registradores
}