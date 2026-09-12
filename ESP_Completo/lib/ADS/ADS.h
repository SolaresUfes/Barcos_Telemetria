#pragma once

#include <Arduino.h>
#include "Estruturas.h"
#include "Config.h"


/* --- DECLARAÇÕES --- */

// Inicia o ADS usando os pinos do I2C
void ADS_iniciar();

// Essa função coleta os dados do ADS. Voce escolhe de quais portas serao coletados colocando "true" dentro da função no loop. Ex.: "coleta_ADS(true, false, true)" retornará os valores para os canais A0 e A2 do ADS, enquanto o A1 não é verificado
resposta_ADS ADS_coleta(bool ads0=false, bool ads1=false, bool ads2=false, bool subtrair_magico=false);

// A lógica dessa função acerca da escolha é igual a da função anterior, com a escolha dependendo do "true" ou "false", mas essa é so pra imprimir os valores no Serial.
void ADS_visualizar(resposta_ADS valores_ADS, bool ads0=false, bool ads1=false, bool ads2=false);
