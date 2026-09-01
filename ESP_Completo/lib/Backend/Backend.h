#pragma once

#include <Arduino.h>
#include "Estruturas.h"


/* --- DECLARAÇÕES --- */

// Usa o link para a inserção de DADOS no backend e insere os dados que vierem
void enviar_dados_bateria(DADOS_BATERIA dado_bateria);

// Usa o link para a inserção de ALERTAS no backend e insere os dados que vierem
void enviar_alertas_bateria(ALERTAS_BATERIA alerta_bateria);

// Usa o link para a inserção de VALORES DAS CELULAS no backend e insere os dados que vierem
void enviar_dados_celulas(CELULAS_INDIVIDUAIS individuais);

// Usa os alertas que vierem pra deixar no padrçao que o backend aceita e que fique mais fácil pra adicionar em outros lugares
String retornar_alertas(ALERTAS_BATERIA alertas);

// Conecta no Wi-fi que for compartilhado
void conectar_wifi();