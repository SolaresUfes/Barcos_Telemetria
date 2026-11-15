#ifndef BUSCA_CANAL_H
#define BUSCA_CANAL_H
#include <stdint.h>

// Todos os instantes usam esp_timer (microssegundos), incluindo light sleep.
struct BuscaCanal {
  static constexpr int64_t AUSENCIA_ANTES_BUSCA_US = 60000000;
  static constexpr uint8_t CONSULTAS_POR_CANAL = 3;
  bool teve_resposta = false;
  bool buscando = true;
  uint8_t consultas_no_canal = 0;
  int64_t ultima_resposta_us = 0;

  bool preparar_consulta(int64_t agora_us) {
    if (teve_resposta && !buscando &&
        agora_us - ultima_resposta_us >= AUSENCIA_ANTES_BUSCA_US) {
      buscando = true;
      consultas_no_canal = CONSULTAS_POR_CANAL;
    }
    return buscando && consultas_no_canal >= CONSULTAS_POR_CANAL;
  }
  void mudou_canal() { consultas_no_canal = 0; }
  void consulta_sem_resposta() {
    if (buscando && consultas_no_canal < CONSULTAS_POR_CANAL) ++consultas_no_canal;
  }
  // Uma resposta já consumida/antiga nunca prolonga o minuto ou cancela busca.
  bool recebeu(int64_t instante_us, int64_t agora_us) {
    if (agora_us - instante_us >= AUSENCIA_ANTES_BUSCA_US) return false;
    if (teve_resposta && instante_us <= ultima_resposta_us) return false;
    teve_resposta = true;
    buscando = false;
    consultas_no_canal = 0;
    ultima_resposta_us = instante_us;
    return true;
  }
};
// Só propõe um canal se toda a faixa configurada pelo driver é válida.
inline bool proximo_canal_permitido(uint8_t atual, uint8_t primeiro, uint8_t quantidade, uint8_t &proximo)
{
  const uint16_t ultimo = uint16_t(primeiro) + quantidade - 1;
  if (!quantidade || primeiro < 1 || ultimo > 13) return false;
  proximo = atual < primeiro || atual >= ultimo ? primeiro : atual + 1;
  return true;
}
#endif
