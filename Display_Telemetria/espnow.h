#ifndef ESPNOW_SOLARES_H
#define ESPNOW_SOLARES_H

#include <stdint.h>

// A versão permite rejeitar formatos antigos ou incompatíveis.
constexpr uint16_t VERSAO_PACOTE_TELEMETRIA = 1;
constexpr uint32_t ASSINATURA_PEDIDO_TELEMETRIA = 0x534F4C52;
constexpr uint32_t ASSINATURA_REINICIO_REMOTO = 0x52535452;
constexpr uint32_t CHAVE_REINICIO_REMOTO = 0xA57C31E2;

// Pedido curto enviado pelo display sempre que ele acorda.
struct __attribute__((packed)) PacotePedidoTelemetriaEspNow {
  uint32_t assinatura;
  uint16_t versao;
  uint16_t tamanho;
  uint32_t sequencia;
};

// Comando separado evita interpretar telemetria corrompida como reinício.
struct __attribute__((packed)) PacoteReinicioRemotoEspNow {
  uint32_t assinatura;
  uint16_t versao;
  uint16_t tamanho;
  uint32_t sequencia;
  uint32_t chave;
};

// A ESP transmissora deve enviar exatamente esta estrutura.
struct __attribute__((packed)) PacoteTelemetriaEspNow {
  uint16_t versao;                    // Deve ser VERSAO_PACOTE_TELEMETRIA.
  uint16_t tamanho;                   // Deve ser sizeof(PacoteTelemetriaEspNow).
  uint32_t sequencia;                 // Contador crescente definido pelo transmissor.
  float bateria_barco_percentual;     // Faixa aceita: 0 a 100.
  float corrente_amperes;             // Corrente positiva ou negativa em ampères.
};

// Esta estrutura já contém os nomes usados pelo restante da aplicação.
struct TelemetriaBarco {
  uint32_t sequencia;
  float bateria_percentual;
  float corrente_amperes;
};

// Inicia o receptor no canal em que o Wi-Fi já está conectado.
bool iniciar_espnow();

// Solicita ao transmissor uma amostra atual de bateria e corrente.
bool solicitar_telemetria();

// Envia o mesmo comando três vezes para tolerar uma perda isolada de rádio.
bool solicitar_reinicio_remoto();

// Copia o último pacote válido uma única vez para o loop principal.
bool obter_nova_telemetria(TelemetriaBarco &telemetria);

#endif
