# Módulo ADS

## Introdução

Este módulo é responsável pela aquisição de sinais analógicos do sistema utilizando o conversor analógico-digital externo **ADS1115**.

O ESP32 possui conversores analógico-digitais internos, porém o uso de um módulo externo permite centralizar a aquisição dos sinais e utilizar os recursos oferecidos pelo ADS1115 para realizar as leituras necessárias pelo projeto.

O módulo realiza a comunicação com o ADS1115 através da interface **I2C**, coleta os valores dos canais configurados, calcula uma média de múltiplas leituras para reduzir flutuações e retorna os resultados já convertidos para tensão.

---

## Estrutura

Os arquivos pertencentes a este módulo são:

```text
ADS/
├── ADS.h
├── ADS.cpp
└── README.md
```

### `ADS.h`

Contém a interface pública do módulo.

É responsável por disponibilizar para outros arquivos:

* As declarações das funções do módulo;
* As opções de seleção dos canais;
* A interface utilizada para inicializar o ADS1115;
* As funções de coleta e visualização dos dados;
* A dependência da estrutura `resposta_ADS`.

### `ADS.cpp`

Contém a implementação do funcionamento do módulo.

Entre suas responsabilidades estão:

* Inicialização da comunicação I2C;
* Inicialização do ADS1115;
* Configuração do ganho;
* Leitura dos canais diferenciais;
* Conversão dos valores para tensão;
* Cálculo da média das leituras;
* Aplicação opcional do offset experimental;
* Exibição dos resultados pela Serial.

---

## Funcionalidades

O módulo oferece as seguintes funcionalidades:

* Inicialização da comunicação I2C utilizando pinos definidos pelo usuário;
* Inicialização do ADS1115;
* Tentativa contínua de inicialização caso o dispositivo não seja encontrado;
* Leitura individual dos canais diferenciais `0-3`, `1-3` e `2-3`;
* Seleção de quais canais devem ser lidos;
* Realização de 20 leituras por canal;
* Cálculo da média das leituras;
* Conversão dos valores lidos para tensão;
* Aplicação opcional de um offset experimental;
* Retorno dos resultados através da estrutura `resposta_ADS`;
* Visualização opcional dos canais selecionados através da Serial.

---

## Dependências

O módulo utiliza as seguintes bibliotecas:

```cpp
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
```

Além disso, o arquivo `ADS.h` utiliza:

```cpp
#include "Estruturas.h"
```

Esse arquivo fornece a definição do tipo `resposta_ADS`, utilizado como retorno da função `coleta_ADS()`.

> `Estruturas.h` não faz parte deste módulo e, portanto, não é documentado neste README.

---

## Hardware e Interface

### ADS1115

O módulo foi desenvolvido para utilizar o conversor analógico-digital **ADS1115**.

A comunicação entre o microcontrolador e o ADS1115 é realizada através de:

| Interface | Utilização                                            |
| --------- | ----------------------------------------------------- |
| I2C       | Comunicação com o ADS1115                             |
| Serial    | Mensagens de inicialização e visualização dos valores |

Os pinos utilizados para o I2C são recebidos pela função de inicialização:

```cpp
iniciar_ADS(SDA, SCL);
```

Isso permite que a definição dos pinos seja realizada externamente ao módulo.

---

## Configuração Interna

### Offset experimental

O módulo possui um valor de offset utilizado opcionalmente durante o processamento das leituras:

```cpp
#define numero_magico 2.500125
```

Esse valor foi obtido experimentalmente como uma referência aproximada para a saída de `0 V` dos sensores de efeito Hall utilizados pelo sistema.

Quando solicitado, esse valor é subtraído das leituras:

```text
Tensão corrigida = Tensão medida - numero_magico
```

A aplicação desse offset é opcional e controlada pelo parâmetro `subtrair_magico` da função `coleta_ADS()`.

---

### Ganho do ADS1115

Durante a inicialização, o módulo configura o ADS1115 com:

```cpp
ads.setGain(GAIN_ONE);
```

A configuração de ganho influencia a faixa de medição utilizada pelo conversor.

---

## Inicialização

Antes de realizar qualquer leitura, o módulo deve ser inicializado.

A função responsável por isso é:

```cpp
iniciar_ADS(SDA, SCL);
```

Exemplo:

```cpp
void setup() {
    Serial.begin(9600);

    iniciar_ADS(21, 22);
}
```

Durante a inicialização, o módulo:

1. Inicia a comunicação I2C;
2. Exibe uma mensagem indicando o início da inicialização;
3. Tenta estabelecer comunicação com o ADS1115;
4. Caso não consiga inicializar o dispositivo, continua tentando;
5. Configura o ganho do ADS1115;
6. Exibe uma mensagem de sucesso quando o dispositivo é iniciado.

### Comportamento em caso de falha

Caso o ADS1115 não seja encontrado, o código executa repetidamente:

```text
Tenta inicializar
       |
       v
Falhou?
   |       |
  Sim     Não
   |       |
   v       v
Aguarda   Continua
1 segundo funcionando
   |
   └────> Tenta novamente
```

Portanto, enquanto o ADS1115 não for inicializado corretamente, a execução permanece nesse processo de tentativa.

---

# API

## `iniciar_ADS()`

```cpp
void iniciar_ADS(int SDA, int SCL);
```

Inicializa a comunicação I2C e o ADS1115.

### Parâmetros

| Parâmetro | Tipo  | Descrição                                  |
| --------- | ----- | ------------------------------------------ |
| `SDA`     | `int` | Pino utilizado como SDA na comunicação I2C |
| `SCL`     | `int` | Pino utilizado como SCL na comunicação I2C |

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Observações

O módulo permanece tentando inicializar o ADS1115 até obter sucesso.

---

## `coleta_ADS()`

```cpp
resposta_ADS coleta_ADS(
    bool ads0 = false,
    bool ads1 = false,
    bool ads2 = false,
    bool subtrair_magico = false
);
```

Realiza a leitura dos canais selecionados do ADS1115.

Cada canal solicitado é lido **20 vezes**, e o módulo calcula a média das tensões obtidas.

Os resultados são retornados através da estrutura `resposta_ADS`.

### Parâmetros

| Parâmetro         | Tipo   | Descrição                                                  |
| ----------------- | ------ | ---------------------------------------------------------- |
| `ads0`            | `bool` | Define se o canal diferencial `0-3` será lido              |
| `ads1`            | `bool` | Define se o canal diferencial `1-3` será lido              |
| `ads2`            | `bool` | Define se o canal diferencial `2-3` será lido              |
| `subtrair_magico` | `bool` | Define se o offset experimental será subtraído dos valores |

### Retorno

```cpp
resposta_ADS
```

Retorna uma estrutura contendo os valores calculados para os canais.

### Leitura dos canais

Os canais são lidos utilizando entradas diferenciais:

| Seleção | Leitura realizada |
| ------- | ----------------- |
| `ads0`  | Diferencial `0-3` |
| `ads1`  | Diferencial `1-3` |
| `ads2`  | Diferencial `2-3` |

### Média das leituras

Para cada canal selecionado, o processo é:

```text
Leitura 1
Leitura 2
Leitura 3
   .
   .
   .
Leitura 20
     |
     v
 Soma das leituras
     |
     v
Divisão por 20
     |
     v
Valor médio
```

Essa média ajuda a reduzir parte das flutuações presentes nas leituras individuais.

### Aplicação do offset

Caso:

```cpp
subtrair_magico == true
```

o valor experimental definido como `numero_magico` será subtraído da tensão média.

Exemplo:

```cpp
resposta_ADS valores = coleta_ADS(
    true,
    true,
    true,
    true
);
```

Nesse caso:

* Os três canais serão lidos;
* Será calculada a média de 20 leituras para cada canal;
* O offset experimental será subtraído dos resultados.

---

## `visualizar_ADS()`

```cpp
void visualizar_ADS(
    resposta_ADS valores_ADS,
    bool ads0 = false,
    bool ads1 = false,
    bool ads2 = false
);
```

Exibe no monitor Serial os valores dos canais selecionados.

### Parâmetros

| Parâmetro     | Tipo           | Descrição                                        |
| ------------- | -------------- | ------------------------------------------------ |
| `valores_ADS` | `resposta_ADS` | Estrutura contendo os valores que serão exibidos |
| `ads0`        | `bool`         | Define se `ADS0` será exibido                    |
| `ads1`        | `bool`         | Define se `ADS1` será exibido                    |
| `ads2`        | `bool`         | Define se `ADS2` será exibido                    |

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Exemplo de saída

Para os canais selecionados, a saída segue o formato:

```text
ADS0: 2.500000V
ADS1: 2.485000V
ADS2: 2.510000V
```

---

# Estruturas de Dados

## `resposta_ADS`

A função `coleta_ADS()` retorna um objeto do tipo:

```cpp
resposta_ADS
```

Esse tipo é definido externamente no arquivo:

```text
Estruturas.h
```

No módulo ADS, a estrutura é utilizada para armazenar os resultados correspondentes aos canais:

* `ADS0`
* `ADS1`
* `ADS2`

Como a definição completa da estrutura não está presente nos arquivos deste módulo, ela não é reproduzida neste README.

---

# Exemplo de Utilização

Um fluxo básico de utilização pode ser:

```cpp
#include <Arduino.h>
#include "ADS.h"

void setup() {
    Serial.begin(9600);

    iniciar_ADS(21, 22);
}

void loop() {

    resposta_ADS valores = coleta_ADS(
        true,
        true,
        true,
        true
    );

    visualizar_ADS(
        valores,
        true,
        true,
        true
    );

    delay(1000);
}
```

Nesse exemplo:

1. A comunicação Serial é iniciada;
2. O ADS1115 é inicializado;
3. Os três canais são selecionados;
4. Cada canal recebe 20 leituras;
5. A média das leituras é calculada;
6. O offset experimental é aplicado;
7. Os resultados são armazenados em `resposta_ADS`;
8. Os valores são exibidos no monitor Serial.

---

# Fluxo de Funcionamento

O funcionamento geral do módulo pode ser representado da seguinte forma:

```text
                iniciar_ADS()
                      |
                      v
              Inicialização do I2C
                      |
                      v
             Inicialização do ADS1115
                      |
                      v
              Configuração do ganho
                      |
                      v
               coleta_ADS(...)
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Canal 0     Canal 1     Canal 2
       (se ativo)  (se ativo)  (se ativo)
          |           |           |
          +-----------+-----------+
                      |
                      v
            20 leituras por canal
                      |
                      v
              Cálculo da média
                      |
                      v
        Aplicação opcional do offset
                      |
                      v
            Retorno de resposta_ADS
                      |
                      v
            visualizar_ADS(...) opcional
```

---

# Observações

* O módulo deve ser inicializado antes de qualquer tentativa de leitura.
* Apenas os canais selecionados com `true` são processados.
* Os canais não selecionados não passam pelo processo de leitura.
* Cada canal selecionado realiza 20 leituras antes de produzir o resultado final.
* O offset experimental é aplicado apenas quando `subtrair_magico` é definido como `true`.
* A função `visualizar_ADS()` apenas exibe valores que já foram obtidos; ela não realiza novas leituras.
* A definição completa de `resposta_ADS` pertence a uma dependência externa do módulo.
* A comunicação com o ADS1115 depende do funcionamento correto da interface I2C e das conexões físicas do dispositivo.
