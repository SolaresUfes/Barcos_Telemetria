#include "EMISSOR.h"

// Pinos
// Fio AMARELO (RXD do LoRa) - 15
// Fio LARANJA (TXD do LoRa) - 16
// Fio do AUX                - 8 (ALTO = módulo livre, BAIXO = módulo ocupado)

void LORA_iniciar_modulo_emissor(){

  LORA_iniciar_aux(AUX_EMISSOR);
  Serial2.begin(BAUD_MODULOS, SERIAL_8N1, RX_EMISSOR, TX_EMISSOR);

  // Depois de ligar, o módulo faz um autoteste e mantém o AUX em BAIXO até terminar.
  bool pronto = LORA_aguardar_aux_livre(AUX_EMISSOR, AUX_TIMEOUT_MODO_MS);

  Serial.println("\n=========================================");
  Serial.println("[BARCO - S3] TRANSMISSOR INICIADO (com AUX)");
  if (!pronto) Serial.println("[AVISO] AUX nao subiu apos ligar o modulo (fio solto?)");
  Serial.println("=========================================");

}

void LORA_enviar_pacote(String dados) {
  // Só escreve na UART com o módulo livre (AUX ALTO). Se o módulo ainda estiver
  // transmitindo o pacote anterior (ou segurando o canal por causa do LBT), escrever agora
  // encheria o buffer interno dele e poderia perder dados.
  // Se o AUX não responder, manda mesmo assim (comportamento de antes do AUX) para uma
  // falha no fio não derrubar a telemetria inteira.
  bool livre = LORA_aguardar_aux_livre(AUX_EMISSOR, AUX_TIMEOUT_TX_MS);
  if (!livre) Serial.println("[AVISO] AUX ocupado alem do timeout; enviando mesmo assim.");

  // Envia a string pelo rádio LoRa com quebra de linha (\n) no final
  Serial2.println(dados);
  // Espera o último byte sair da UART do ESP32: sem isso o AUX ainda poderia estar ALTO
  // (o módulo nem recebeu os bytes) e a próxima checagem de AUX passaria direto.
  Serial2.flush();

  // Imprime no monitor do PC pra debug
  Serial.print("Transmitindo: ");
  Serial.println(dados);
}
