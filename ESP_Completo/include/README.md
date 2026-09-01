# Arquivos de Inclusão e Configurações Compartilhadas

A pasta `include/` concentra os **arquivos de cabeçalho compartilhados pelo projeto**.

Enquanto a pasta `lib/` contém os módulos responsáveis pelas funcionalidades específicas do sistema e a pasta `src/` concentra a integração e execução principal, a pasta `include/` reúne definições que podem ser utilizadas por diferentes partes do projeto.

Atualmente, essa pasta possui duas responsabilidades principais:

* Centralizar configurações compartilhadas;
* Centralizar estruturas de dados utilizadas na comunicação entre módulos.

Essa organização evita a duplicação de definições e permite que alterações importantes sejam realizadas em um único local.

---

## Estrutura

Atualmente, a pasta possui a seguinte organização:

```text
include/
├── Config.h
├── Estruturas.h
└── README.md
```

| Arquivo        | Responsabilidade                             |
| -------------- | -------------------------------------------- |
| `Config.h`     | Configurações compartilhadas do projeto      |
| `Estruturas.h` | Estruturas de dados utilizadas pelos módulos |
| `README.md`    | Documentação da organização da pasta         |

---

# `Config.h`

O arquivo `Config.h` concentra configurações utilizadas por diferentes partes do projeto.

Atualmente, ele possui definições relacionadas a:

* Taxas de comunicação;
* Pinos utilizados pelo ESP32;
* Comunicação I2C;
* Comunicação com o BMS através do MAX485.

O arquivo utiliza:

```cpp
#pragma once
```

para evitar múltiplas inclusões durante a compilação.

---

## Taxas de Comunicação

Atualmente, estão definidas duas taxas de comunicação:

```cpp
#define BAUD_SERIAL 115200
#define BAUD_BMS 9600
```

### `BAUD_SERIAL`

Define a taxa de comunicação utilizada pela Serial principal.

Valor atual:

```text
115200
```

Essa definição pode ser utilizada durante a inicialização:

```cpp
Serial.begin(BAUD_SERIAL);
```

---

### `BAUD_BMS`

Define a taxa de comunicação utilizada para a comunicação com o BMS.

Valor atual:

```text
9600
```

Essa configuração pode ser utilizada pelo módulo responsável pela comunicação com o BMS.

---

# Definição dos Pinos

O arquivo `Config.h` também centraliza os pinos utilizados pelas interfaces de comunicação do projeto.

## Comunicação I2C

Os pinos utilizados para a comunicação I2C com o ADS são:

```cpp
#define SDA_ADS 21
#define SCL_ADS 22
```

| Definição |    Pino |
| --------- | ------: |
| `SDA_ADS` | GPIO 21 |
| `SCL_ADS` | GPIO 22 |

Essas definições permitem inicializar o módulo ADS sem precisar declarar diretamente os números dos pinos no arquivo principal.

Por exemplo:

```cpp
iniciar_ADS(SDA_ADS, SCL_ADS);
```

---

## Comunicação com o BMS

Os pinos relacionados à comunicação com o BMS através do MAX485 são:

```cpp
#define RXD2 16
#define TXD2 17
#define RS485_CONTROL 23
```

| Definição       |    Pino | Responsabilidade                  |
| --------------- | ------: | --------------------------------- |
| `RXD2`          | GPIO 16 | Recepção da comunicação serial    |
| `TXD2`          | GPIO 17 | Transmissão da comunicação serial |
| `RS485_CONTROL` | GPIO 23 | Controle da comunicação RS485     |

Essas definições são utilizadas para evitar números fixos espalhados pelos arquivos do projeto.

Caso seja necessário alterar um desses pinos, a modificação pode ser realizada diretamente em `Config.h`.

---

# `Estruturas.h`

O arquivo `Estruturas.h` concentra as estruturas utilizadas para transportar informações entre diferentes módulos do projeto.

Assim como `Config.h`, o arquivo utiliza:

```cpp
#pragma once
```

Dessa forma, as estruturas podem ser incluídas em diferentes arquivos sem que suas definições sejam processadas repetidamente.

As estruturas atualmente presentes no arquivo estão relacionadas a:

* Dados gerais da bateria;
* Alertas do BMS;
* Dados individuais das células;
* Respostas obtidas pelo módulo ADS.

---

# `DADOS_BATERIA`

```cpp
struct DADOS_BATERIA {
    float tensao;
    float corrente;
    float porcentagem;
};
```

Essa estrutura representa os dados gerais da bateria utilizados pelo sistema.

| Campo         | Tipo    | Descrição              |
| ------------- | ------- | ---------------------- |
| `tensao`      | `float` | Valor da tensão        |
| `corrente`    | `float` | Valor da corrente      |
| `porcentagem` | `float` | Porcentagem da bateria |

Essa estrutura permite que os dados sejam agrupados e transmitidos entre módulos utilizando um único objeto.

Por exemplo:

```cpp
DADOS_BATERIA dados = ler_dados_bms();
```

O módulo BMS pode fornecer os dados utilizando essa estrutura, que posteriormente pode ser utilizada pelo módulo Backend.

---

# `ALERTAS_BATERIA`

```cpp
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
```

Essa estrutura representa os estados relacionados aos alertas e condições de falha da bateria.

Cada campo possui o tipo:

```cpp
bool
```

e representa se determinada condição está ativa ou não.

---

## Alertas das Células

| Campo                | Descrição                                    |
| -------------------- | -------------------------------------------- |
| `celula_sobretensao` | Indica condição de sobretensão em uma célula |
| `celula_subtensao`   | Indica condição de subtensão em uma célula   |

---

## Alertas do Pack

| Campo              | Descrição                  |
| ------------------ | -------------------------- |
| `pack_sobretensao` | Indica sobretensão no pack |
| `pack_subtensao`   | Indica subtensão no pack   |

---

## Alertas de Temperatura

| Campo                | Descrição                       |
| -------------------- | ------------------------------- |
| `temp_carga_alta`    | Temperatura de carga elevada    |
| `temp_carga_baixa`   | Temperatura de carga baixa      |
| `temp_descarga_alta` | Temperatura de descarga elevada |
| `mosfet_temp_alta`   | Temperatura elevada do MOSFET   |

---

## Alertas de Corrente e Proteção

| Campo                    | Descrição                                    |
| ------------------------ | -------------------------------------------- |
| `corrente_carga_alta`    | Corrente de carga elevada                    |
| `corrente_descarga_alta` | Corrente de descarga elevada                 |
| `curto_circuito`         | Condição de curto-circuito                   |
| `mosfet_travado`         | Condição relacionada ao travamento do MOSFET |

---

## `alerta_ativo`

Além dos alertas individuais, a estrutura possui:

```cpp
bool alerta_ativo;
```

Esse campo representa o estado geral utilizado pelo sistema para indicar a existência de um alerta ativo.

Ele pode ser utilizado pelos módulos que precisam decidir se os dados de alerta devem ser processados ou enviados.

Por exemplo, o módulo Backend pode verificar esse estado antes de realizar o envio das informações relacionadas aos alertas.

---

# `CELULAS_INDIVIDUAIS`

```cpp
struct CELULAS_INDIVIDUAIS {
    float celulas[16] = {0};
};
```

Essa estrutura armazena os valores individuais das células.

Os dados são armazenados em um array de:

```text
16 posições
```

Cada posição possui o tipo:

```cpp
float
```

e representa o valor correspondente a uma célula.

Os valores são inicializados com:

```cpp
{0}
```

quando a estrutura é criada.

Um exemplo de acesso é:

```cpp
CELULAS_INDIVIDUAIS dados;

float primeira_celula = dados.celulas[0];
```

Essa estrutura é utilizada para transportar os dados individuais das células entre os módulos do sistema.

---

# `resposta_ADS`

```cpp
struct resposta_ADS {
    double ADS0, ADS1, ADS2;
};
```

Essa estrutura representa os valores obtidos pelo módulo ADS.

Ela possui três campos:

| Campo  | Tipo     | Descrição                      |
| ------ | -------- | ------------------------------ |
| `ADS0` | `double` | Valor obtido no primeiro canal |
| `ADS1` | `double` | Valor obtido no segundo canal  |
| `ADS2` | `double` | Valor obtido no terceiro canal |

A estrutura permite que as leituras realizadas pelo módulo ADS sejam retornadas utilizando um único objeto.

Por exemplo:

```cpp
resposta_ADS valores = coleta_ADS();
```

Os valores individuais podem então ser acessados através de:

```cpp
valores.ADS0;
valores.ADS1;
valores.ADS2;
```

---

# Comunicação Entre os Módulos

As estruturas presentes em `Estruturas.h` permitem que diferentes módulos utilizem os mesmos formatos de dados.

Essa centralização evita que cada módulo precise criar sua própria versão das estruturas utilizadas pelo sistema.

Atualmente, a organização geral pode ser entendida da seguinte forma:

* O módulo `BMS` utiliza estruturas relacionadas à bateria, alertas e células;
* O módulo `Backend` recebe estruturas contendo informações que devem ser enviadas ao servidor;
* O módulo `ADS` utiliza `resposta_ADS` para retornar suas leituras;
* O arquivo principal pode utilizar essas estruturas para transportar dados entre os módulos.

Essa organização permite que cada módulo conheça apenas os formatos necessários para sua interface pública.

---

# Utilização dos Arquivos de Cabeçalho

Os arquivos desta pasta podem ser incluídos quando suas definições forem necessárias.

Por exemplo, para utilizar as configurações:

```cpp
#include "Config.h"
```

Para utilizar as estruturas compartilhadas:

```cpp
#include "Estruturas.h"
```

Após a inclusão, as definições presentes no arquivo ficam disponíveis para o código que realizou o `#include`.

---

# Organização e Manutenção

A pasta `include/` deve concentrar definições que realmente precisam ser compartilhadas entre diferentes partes do projeto.

Alguns exemplos adequados para essa pasta são:

* Configurações de comunicação;
* Definições de pinos;
* Constantes compartilhadas;
* Estruturas utilizadas por múltiplos módulos;
* Tipos utilizados em interfaces públicas.

Por outro lado, detalhes específicos da implementação de apenas um módulo devem permanecer, sempre que possível, dentro do próprio módulo.

Por exemplo:

* Configurações exclusivas da implementação do ADS devem permanecer no módulo ADS;
* Lógica exclusiva da comunicação com o BMS deve permanecer no módulo BMS;
* Detalhes internos da comunicação HTTP devem permanecer no módulo Backend.

Essa separação evita que `include/` se transforme em uma pasta contendo definições sem organização ou responsabilidades claramente definidas.

---

# Boas Práticas para Novas Configurações

Ao adicionar uma nova configuração, é recomendado avaliar se ela realmente precisa ser compartilhada.

Uma configuração pode ser adicionada ao `Config.h` quando:

* For utilizada por mais de uma parte do projeto;
* Representar uma característica global do hardware;
* Precisar ser facilmente modificada sem procurar em diversos arquivos.

Caso a configuração seja utilizada exclusivamente dentro de um módulo, pode ser mais adequado mantê-la dentro do respectivo arquivo `.cpp` ou `.h`.

---

# Boas Práticas para Novas Estruturas

Uma nova estrutura pode ser adicionada ao `Estruturas.h` quando ela:

* For utilizada por mais de um módulo;
* Representar um formato de dados compartilhado;
* Fizer parte da comunicação entre diferentes partes do sistema.

Estruturas utilizadas exclusivamente por uma implementação específica podem permanecer dentro do módulo correspondente.

---

# Observações

* A pasta `include/` concentra arquivos de cabeçalho compartilhados pelo projeto.
* `Config.h` centraliza configurações relacionadas à comunicação e aos pinos.
* `Estruturas.h` centraliza os formatos de dados utilizados pelos módulos.
* Ambos os arquivos utilizam `#pragma once`.
* As estruturas permitem transportar informações entre módulos sem duplicar definições.
* Alterações nos valores definidos em `Config.h` podem afetar diferentes partes do sistema.
* Alterações nas estruturas de `Estruturas.h` podem exigir ajustes nos módulos que utilizam seus campos.
* Detalhes exclusivos de implementação devem permanecer, preferencialmente, dentro dos respectivos módulos.
* Esta pasta deve permanecer focada em definições compartilhadas, evitando concentrar lógica de funcionamento do sistema.
