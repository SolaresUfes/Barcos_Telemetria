#pragma once


/* --- ESTRUTURAS DO BACKEND/BMS --- */

// Estrutura com as variaveis dos dados do BMS
struct DADOS_BATERIA {
    float tensao;
    float corrente;
    float porcentagem;
};

// Estrutura com os valores (TRUE or FALSE) dos alertas do BMS
struct ALERTAS_BATERIA {
    bool celula_sobretensao;
    bool celula_subtensao;

    bool pack_sobretensao;
    bool pack_subtensao;

    bool temp_carga_alta;
    bool temp_carga_baixa;
    bool temp_descarga_alta;
    bool mosfet_temp_alta;

    bool corrente_carga_alta;
    bool corrente_descarga_alta;
    bool curto_circuito;
    bool mosfet_travado;

    bool alerta_ativo;
};

// Estrutura com dados individuais de tensao para cada celula
struct CELULAS_INDIVIDUAIS {
    float celulas[16] = {0};
};

/* --- ESTRUTURA DO ADS --- */

struct resposta_ADS {
    double ADS0, ADS1, ADS2;
};

// Estrutura exata esperada pelo firmware do display.
struct __attribute__((packed)) PacoteTelemetriaEspNow {
  uint16_t versao;
  uint16_t tamanho;
  uint32_t sequencia;
  float bateria_barco_percentual;
  float corrente_amperes;
};
