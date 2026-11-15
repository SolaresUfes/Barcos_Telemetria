# Módulo BMS

## Introdução

Este módulo é responsável pela comunicação entre o ESP32 e o **Battery Management System (BMS)** utilizado pelo projeto.

Sua função é concentrar toda a lógica necessária para solicitar, receber e interpretar as informações fornecidas pelo BMS. Dessa forma, o restante do sistema não precisa lidar diretamente com os detalhes da comunicação ou com a interpretação dos dados recebidos.

O módulo disponibiliza funções para obter três grupos principais de informações:

* Dados gerais da bateria;
* Alertas e condições de falha;
* Dados individuais das células.

Além da aquisição dessas informações, o módulo também realiza a interpretação dos dados relacionados aos alertas, convertendo a resposta recebida do BMS em uma estrutura mais adequada para utilização pelos demais módulos do projeto.

---

## Estrutura

Os arquivos pertencentes a este módulo são:

```text
BMS/
├── BMS.h
├── BMS.cpp
└── README.md
```

### `BMS.h`

Contém a interface pública do módulo.

É responsável por declarar as funções disponíveis para os outros módulos do projeto, incluindo:

* Inicialização da comunicação com o BMS;
* Leitura dos dados gerais da bateria;
* Leitura dos alertas;
* Leitura dos valores individuais das células;
* Interpretação das respostas relacionadas a falhas.

O arquivo também depende de `Estruturas.h`, onde estão definidos os tipos utilizados como retorno pelas funções do módulo.

### `BMS.cpp`

Contém a implementação da comunicação e do processamento dos dados fornecidos pelo BMS.

Entre suas responsabilidades estão:

* Configuração dos recursos necessários para comunicação;
* Solicitação das informações ao BMS;
* Recebimento das respostas;
* Processamento dos dados recebidos;
* Conversão das informações para as estruturas utilizadas pelo restante do projeto;
* Interpretação das condições de alerta e falha.

---

## Funcionalidades

O módulo oferece as seguintes funcionalidades:

* Inicialização dos recursos necessários para comunicação com o BMS;
* Leitura dos dados relacionados ao status geral da bateria;
* Leitura das informações relacionadas a falhas e alertas;
* Leitura dos dados individuais das células;
* Conversão das respostas do BMS para estruturas utilizadas pelo projeto;
* Interpretação dos bytes relacionados a falhas para facilitar sua manipulação pelo restante do sistema.

---

## Dependências

O arquivo de interface do módulo utiliza:

```cpp
#include <Arduino.h>
#include "Estruturas.h"
```

### `Arduino.h`

Fornece os tipos e recursos básicos utilizados pelo ambiente Arduino/ESP32.

Entre os recursos utilizados pela interface está o tipo:

```cpp
byte
```

utilizado pela função responsável pela interpretação das respostas relacionadas aos alertas.

### `Estruturas.h`

Fornece os tipos utilizados pela API pública do módulo:

* `DADOS_BATERIA`;
* `ALERTAS_BATERIA`;
* `CELULAS_INDIVIDUAIS`.

Essas estruturas são utilizadas como retorno pelas funções de leitura do BMS.

> `Estruturas.h` não faz parte deste módulo e, portanto, suas definições completas não são reproduzidas neste README.

---

# API

## `iniciar_BMS()`

```cpp
void iniciar_BMS();
```

Inicializa os recursos necessários para a comunicação com o BMS.

De acordo com a interface do módulo, essa inicialização envolve a preparação dos elementos relacionados à comunicação e às definições iniciais necessárias para leitura e escrita, incluindo os recursos utilizados com o MAX485.

### Parâmetros

Esta função não recebe parâmetros.

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Utilização

A inicialização deve ser realizada antes das funções responsáveis pela leitura dos dados do BMS.

Um uso básico pode ser:

```cpp
void setup() {
    iniciar_BMS();
}
```

---

## `ler_dados_bms()`

```cpp
DADOS_BATERIA ler_dados_bms();
```

Realiza a leitura dos dados do BMS relacionados ao conjunto identificado internamente como:

```cpp
status_geral[]
```

Os dados processados são retornados através da estrutura:

```cpp
DADOS_BATERIA
```

### Parâmetros

Esta função não recebe parâmetros.

### Retorno

```cpp
DADOS_BATERIA
```

Retorna uma estrutura contendo os dados gerais da bateria obtidos a partir da resposta correspondente do BMS.

### Observações

A definição detalhada dos campos de `DADOS_BATERIA` pertence ao arquivo externo `Estruturas.h`.

---

## `ler_alertas_bms()`

```cpp
ALERTAS_BATERIA ler_alertas_bms();
```

Realiza a leitura dos dados relacionados às falhas e alertas do BMS.

A interface identifica essas informações como dados relacionados ao conjunto:

```cpp
falhas[]
```

O resultado é retornado utilizando a estrutura:

```cpp
ALERTAS_BATERIA
```

### Parâmetros

Esta função não recebe parâmetros.

### Retorno

```cpp
ALERTAS_BATERIA
```

Retorna uma estrutura contendo os estados dos alertas interpretados a partir das informações fornecidas pelo BMS.

### Observações

A interpretação dos dados de falha pode utilizar a função:

```cpp
interpretador(...)
```

para transformar a resposta recebida em informações mais adequadas para utilização pelo sistema.

---

## `ler_celulas_bms()`

```cpp
CELULAS_INDIVIDUAIS ler_celulas_bms();
```

Realiza a leitura dos dados individuais das células fornecidos pelo BMS.

A interface identifica essas informações como dados relacionados ao conjunto:

```cpp
cel_individual[]
```

Os valores processados são retornados utilizando:

```cpp
CELULAS_INDIVIDUAIS
```

### Parâmetros

Esta função não recebe parâmetros.

### Retorno

```cpp
CELULAS_INDIVIDUAIS
```

Retorna uma estrutura contendo os dados individuais das células obtidos a partir do BMS.

### Observações

A quantidade e a organização interna dos dados retornados dependem da definição de `CELULAS_INDIVIDUAIS`, localizada em `Estruturas.h`.

---

## `interpretador()`

```cpp
ALERTAS_BATERIA interpretador(byte resposta[13]);
```

Interpreta uma resposta relacionada a falhas ou alertas recebida do BMS.

A função recebe um conjunto de 13 bytes e converte as informações relevantes para uma estrutura do tipo:

```cpp
ALERTAS_BATERIA
```

Seu objetivo é facilitar a manipulação dos alertas pelo restante do sistema, evitando que outros módulos precisem trabalhar diretamente com os bytes recebidos pela comunicação.

### Parâmetros

| Parâmetro  | Tipo       | Descrição                                      |
| ---------- | ---------- | ---------------------------------------------- |
| `resposta` | `byte[13]` | Dados recebidos do BMS que serão interpretados |

### Retorno

```cpp
ALERTAS_BATERIA
```

Retorna uma estrutura contendo a interpretação dos alertas presentes na resposta recebida.

---

# Estruturas de Dados

O módulo utiliza três tipos principais definidos externamente em:

```text
Estruturas.h
```

## `DADOS_BATERIA`

Utilizada como retorno da função:

```cpp
ler_dados_bms();
```

Representa os dados gerais da bateria obtidos a partir do BMS.

---

## `ALERTAS_BATERIA`

Utilizada como retorno das funções:

```cpp
ler_alertas_bms();
interpretador(...);
```

Representa as informações relacionadas a falhas e alertas.

---

## `CELULAS_INDIVIDUAIS`

Utilizada como retorno da função:

```cpp
ler_celulas_bms();
```

Representa os dados individuais das células fornecidos pelo BMS.

> Como as definições dessas estruturas não pertencem aos arquivos deste módulo, seus campos não são reproduzidos neste README.

---

# Exemplo de Utilização

Um exemplo básico de utilização do módulo pode ser:

```cpp
#include <Arduino.h>
#include "BMS.h"

void setup() {
    Serial.begin(9600);

    iniciar_BMS();
}

void loop() {

    DADOS_BATERIA dados = ler_dados_bms();

    ALERTAS_BATERIA alertas = ler_alertas_bms();

    CELULAS_INDIVIDUAIS celulas = ler_celulas_bms();

    delay(1000);
}
```

Nesse exemplo:

1. A comunicação Serial é inicializada;
2. Os recursos necessários para comunicação com o BMS são inicializados;
3. Os dados gerais da bateria são solicitados;
4. Os alertas são obtidos;
5. Os dados individuais das células são obtidos;
6. As informações ficam disponíveis nas estruturas correspondentes para utilização pelos outros módulos do projeto.

---

# Organização da Responsabilidade do Módulo

A interface pública do módulo foi organizada para separar os diferentes tipos de informação fornecidos pelo BMS.

| Função              | Informação obtida                                   |
| ------------------- | --------------------------------------------------- |
| `ler_dados_bms()`   | Dados gerais da bateria                             |
| `ler_alertas_bms()` | Falhas e alertas                                    |
| `ler_celulas_bms()` | Dados individuais das células                       |
| `interpretador()`   | Conversão dos dados de falha para `ALERTAS_BATERIA` |

Essa divisão permite que outros módulos solicitem apenas o tipo de informação necessário para determinada operação.

---

# Observações

* `iniciar_BMS()` deve ser chamada antes da utilização das funções de leitura.
* O módulo utiliza estruturas externas definidas em `Estruturas.h`.
* A API separa a leitura dos dados gerais, alertas e células individuais em funções diferentes.
* A função `interpretador()` recebe uma resposta de 13 bytes para processar informações relacionadas a falhas.
* Os detalhes internos da comunicação e da interpretação dos dados pertencem à implementação presente no arquivo `BMS.cpp`.
* Este README documenta exclusivamente os arquivos pertencentes ao módulo BMS e suas dependências explicitamente utilizadas pela interface.
