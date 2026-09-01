# Módulo Backend

## Introdução

Este módulo centraliza a comunicação do ESP32 com a internet e com o backend do projeto.

Ele é responsável por isolar a lógica relacionada à conexão Wi-Fi, criação de pacotes JSON e envio de informações através de requisições HTTP. Dessa forma, os outros módulos do sistema podem fornecer seus dados sem precisar lidar diretamente com detalhes de conexão ou comunicação com o servidor.

Atualmente, o módulo é responsável pelo envio de três grupos principais de informações:

* Dados gerais da bateria;
* Alertas e condições de erro;
* Dados individuais das células.

---

## Estrutura

Os arquivos pertencentes a este módulo são:

```text
Backend/
├── Backend.h
├── Backend.cpp
└── README.md
```

### `Backend.h`

Contém a interface pública do módulo.

É responsável por disponibilizar as funções utilizadas pelos outros arquivos do projeto para:

* Conectar o ESP32 à rede Wi-Fi;
* Enviar dados gerais da bateria;
* Enviar alertas;
* Enviar dados individuais das células;
* Converter os alertas da bateria para o formato JSON utilizado pelo backend.

### `Backend.cpp`

Contém a implementação da comunicação.

Entre suas responsabilidades estão:

* Armazenamento das credenciais Wi-Fi;
* Definição dos endpoints do backend;
* Gerenciamento da conexão Wi-Fi;
* Criação de clientes HTTP;
* Criação e serialização de documentos JSON;
* Envio de requisições HTTP `POST`;
* Exibição das tentativas de envio pela Serial;
* Conversão dos alertas ativos para códigos numéricos.

---

## Funcionalidades

O módulo oferece as seguintes funcionalidades:

* Conexão do ESP32 a uma rede Wi-Fi;
* Verificação do estado atual da conexão;
* Tentativa de conexão com limite aproximado de 10 segundos;
* Continuação do funcionamento do ESP32 mesmo sem conexão com a internet;
* Tentativa de reconexão antes dos envios;
* Envio de dados da bateria através de HTTP `POST`;
* Envio de alertas através de HTTP `POST`;
* Envio dos valores individuais das células através de HTTP `POST`;
* Organização dos dados enviados no formato JSON;
* Conversão de alertas booleanos para códigos numéricos;
* Exibição dos dados enviados e códigos de resposta HTTP pela Serial.

---

## Dependências

O módulo utiliza as seguintes bibliotecas:

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>
```

### `Arduino.h`

Fornece recursos básicos do ambiente Arduino utilizados pelo módulo, incluindo:

* `Serial`;
* `millis()`;
* `delay()`.

### `WiFi.h`

Responsável pelos recursos utilizados para conectar o ESP32 a uma rede Wi-Fi.

### `HTTPClient.h`

Responsável pela criação das requisições HTTP utilizadas para enviar os dados ao backend.

### `ArduinoJson.h`

Utilizada para criar e serializar os documentos JSON enviados ao servidor.

### `math.h`

Utilizada para verificar valores inválidos através da função:

```cpp
isnan()
```

Além dessas bibliotecas, o módulo depende de:

```cpp
#include "Estruturas.h"
```

Esse arquivo fornece os tipos utilizados pela API pública do módulo:

* `DADOS_BATERIA`;
* `ALERTAS_BATERIA`;
* `CELULAS_INDIVIDUAIS`.

> `Estruturas.h` não faz parte deste módulo e, portanto, suas estruturas não são documentadas completamente neste README.

---

# Configuração

## Credenciais Wi-Fi

As credenciais utilizadas para conectar o ESP32 à rede estão definidas diretamente no arquivo `Backend.cpp`.

A configuração utiliza duas constantes:

```cpp
const char *ssid = "...";
const char *password = "...";
```

Esses valores são utilizados para iniciar a conexão:

```cpp
WiFi.begin(ssid, password);
```

Caso seja necessário utilizar outra rede, as credenciais atualmente precisam ser alteradas no arquivo `Backend.cpp`.

---

## Endpoints do Backend

O módulo possui três endereços configurados para comunicação com o backend:

```cpp
const char *Url_dados;
const char *Url_alertas;
const char *Url_celulas;
```

Cada endereço é utilizado para um tipo específico de informação.

| Endpoint      | Finalidade                                |
| ------------- | ----------------------------------------- |
| `Url_dados`   | Envio dos dados gerais da bateria         |
| `Url_alertas` | Envio dos alertas ativos                  |
| `Url_celulas` | Envio dos valores individuais das células |

Os envios são realizados através de requisições HTTP `POST`.

---

# API

## `conectar_wifi()`

```cpp
void conectar_wifi();
```

Tenta conectar o ESP32 à rede Wi-Fi configurada no módulo.

### Parâmetros

Esta função não recebe parâmetros.

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Funcionamento

Antes de iniciar uma nova tentativa de conexão, a função verifica se o ESP32 já está conectado à rede Wi-Fi.

Caso já exista uma conexão ativa, a função é encerrada imediatamente.

Caso não exista conexão, a função:

1. Inicia a conexão utilizando as credenciais configuradas;
2. Aguarda a conexão durante um período máximo aproximado de 10 segundos;
3. Exibe pontos pela Serial durante a tentativa;
4. Caso a conexão seja estabelecida, exibe uma mensagem de sucesso e o endereço IP obtido;
5. Caso a conexão não seja estabelecida, informa a falha pela Serial;
6. Permite que o ESP32 continue funcionando sem conexão com a internet.

### Observações

A função evita que o sistema fique preso indefinidamente tentando estabelecer uma conexão Wi-Fi.

---

## `enviar_dados_bateria()`

```cpp
void enviar_dados_bateria(DADOS_BATERIA dados);
```

Envia os dados gerais da bateria para o backend.

### Parâmetros

| Parâmetro | Tipo            | Descrição                                     |
| --------- | --------------- | --------------------------------------------- |
| `dados`   | `DADOS_BATERIA` | Estrutura contendo os dados gerais da bateria |

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Verificação da conexão

Antes do envio, o módulo verifica se existe uma conexão Wi-Fi ativa.

Caso não exista, a função:

```cpp
conectar_wifi();
```

é chamada para tentar estabelecer uma conexão.

### Verificação dos dados

Antes de criar a requisição HTTP, a função verifica se:

```cpp
dados.tensao
```

possui um valor inválido (`NaN`).

Caso isso aconteça, o envio é interrompido.

Essa verificação evita que uma leitura inválida seja enviada ao backend.

### Formato dos dados

Os valores enviados são organizados em um documento JSON contendo:

```json
{
    "tensao": 0,
    "corrente": 0,
    "porcentagem": 0
}
```

Os valores utilizados são obtidos diretamente da estrutura `DADOS_BATERIA`.

### Processo de envio

O envio dos dados ocorre nas seguintes etapas:

1. A função recebe uma estrutura `DADOS_BATERIA`;
2. O estado da conexão Wi-Fi é verificado;
3. Caso necessário, é realizada uma tentativa de conexão;
4. A tensão é verificada para evitar o envio de valores `NaN`;
5. Um documento JSON é criado;
6. Os valores de tensão, corrente e porcentagem são adicionados ao documento;
7. O JSON é serializado;
8. Uma requisição HTTP `POST` é enviada para `Url_dados`;
9. O JSON enviado é exibido pela Serial;
10. O código de resposta HTTP é exibido;
11. O cliente HTTP é encerrado.

---

## `enviar_alertas_bateria()`

```cpp
void enviar_alertas_bateria(ALERTAS_BATERIA alertas);
```

Envia os alertas ativos da bateria para o backend.

### Parâmetros

| Parâmetro | Tipo              | Descrição                                            |
| --------- | ----------------- | ---------------------------------------------------- |
| `alertas` | `ALERTAS_BATERIA` | Estrutura contendo os estados dos alertas da bateria |

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Verificação dos alertas

Após verificar a conexão Wi-Fi, a função analisa:

```cpp
alertas.alerta_ativo
```

Caso esse valor seja falso, nenhum envio é realizado.

Quando existe um alerta ativo, a estrutura é convertida para JSON utilizando:

```cpp
retornar_alertas(alertas);
```

A string JSON resultante é enviada para o endpoint configurado em `Url_alertas`.

### Processo de envio

O envio ocorre nas seguintes etapas:

1. A função recebe a estrutura `ALERTAS_BATERIA`;
2. O estado da conexão Wi-Fi é verificado;
3. Caso necessário, é realizada uma tentativa de conexão;
4. O estado geral `alerta_ativo` é verificado;
5. Caso não exista alerta ativo, a função é encerrada;
6. Os alertas são convertidos para JSON;
7. Uma requisição HTTP `POST` é enviada para `Url_alertas`;
8. O JSON enviado é exibido pela Serial;
9. O código de resposta HTTP é exibido;
10. O cliente HTTP é encerrado.

---

## `enviar_dados_celulas()`

```cpp
void enviar_dados_celulas(CELULAS_INDIVIDUAIS dados);
```

Envia os valores individuais das células para o backend.

### Parâmetros

| Parâmetro | Tipo                  | Descrição                                             |
| --------- | --------------------- | ----------------------------------------------------- |
| `dados`   | `CELULAS_INDIVIDUAIS` | Estrutura contendo os valores individuais das células |

### Retorno

Esta função não retorna valores.

```cpp
void
```

### Formato dos dados

O módulo cria um documento JSON contendo um array chamado:

```text
celula
```

Os valores são adicionados utilizando:

```cpp
dados.celulas[i]
```

O código percorre exatamente 16 posições.

A estrutura geral enviada possui o seguinte formato:

```json
{
    "celula": [
        0,
        0,
        0
    ]
}
```

Os valores reais dependem das informações presentes na estrutura recebida.

### Processo de envio

O envio ocorre nas seguintes etapas:

1. A função recebe os valores individuais das células;
2. O estado da conexão Wi-Fi é verificado;
3. Caso necessário, é realizada uma tentativa de conexão;
4. Um documento JSON é criado;
5. Um array chamado `celula` é criado dentro do documento;
6. Os 16 valores presentes em `dados.celulas` são adicionados ao array;
7. O documento JSON é serializado;
8. Uma requisição HTTP `POST` é enviada para `Url_celulas`;
9. O JSON enviado é exibido pela Serial;
10. O código de resposta HTTP é exibido;
11. O cliente HTTP é encerrado.

---

## `retornar_alertas()`

```cpp
String retornar_alertas(ALERTAS_BATERIA alertas);
```

Converte os alertas ativos da bateria para uma representação JSON compatível com o formato utilizado pelo backend.

### Parâmetros

| Parâmetro | Tipo              | Descrição                                 |
| --------- | ----------------- | ----------------------------------------- |
| `alertas` | `ALERTAS_BATERIA` | Estrutura contendo os estados dos alertas |

### Retorno

```cpp
String
```

Retorna uma string contendo o documento JSON gerado.

---

# Conversão dos Alertas

Os alertas da estrutura `ALERTAS_BATERIA` são convertidos para códigos numéricos.

O JSON gerado contém um array chamado:

```text
codigos
```

Cada condição ativa adiciona seu respectivo código ao array.

| Condição                 | Código |
| ------------------------ | -----: |
| `celula_sobretensao`     |    `1` |
| `celula_subtensao`       |    `2` |
| `pack_sobretensao`       |    `3` |
| `pack_subtensao`         |    `4` |
| `temp_carga_alta`        |    `5` |
| `temp_carga_baixa`       |    `6` |
| `temp_descarga_alta`     |    `7` |
| `mosfet_temp_alta`       |    `8` |
| `corrente_carga_alta`    |    `9` |
| `corrente_descarga_alta` |   `10` |
| `curto_circuito`         |   `11` |
| `mosfet_travado`         |   `12` |

Por exemplo, caso os alertas correspondentes aos códigos `1` e `7` estejam ativos, o JSON terá uma estrutura semelhante a:

```json
{
    "codigos": [1, 7]
}
```

---

# Comunicação HTTP

Os três tipos de envio utilizam a mesma base de comunicação:

* Verificação da conexão Wi-Fi;
* Tentativa de conexão quando necessária;
* Criação ou obtenção do JSON correspondente;
* Criação de um cliente HTTP;
* Definição do tipo de conteúdo como JSON;
* Envio de uma requisição HTTP `POST`;
* Exibição dos dados enviados pela Serial;
* Exibição do código de resposta HTTP;
* Encerramento do cliente HTTP.

A principal diferença entre os envios está no formato dos dados e no endpoint utilizado.

---

# Exemplo de Utilização

Um exemplo simplificado de utilização do módulo é:

```cpp
#include <Arduino.h>
#include "Backend.h"

void setup() {
    Serial.begin(9600);

    conectar_wifi();
}

void loop() {

    DADOS_BATERIA dados;

    enviar_dados_bateria(dados);

    delay(1000);
}
```

Nesse exemplo, o módulo:

1. Inicializa a comunicação Serial;
2. Tenta conectar o ESP32 à rede Wi-Fi;
3. Recebe uma estrutura contendo dados da bateria;
4. Verifica a conexão antes do envio;
5. Organiza os dados no formato JSON;
6. Envia os dados para o endpoint configurado.

---

# Observações e Limitações

* As credenciais Wi-Fi estão atualmente definidas diretamente no arquivo `Backend.cpp`.
* Os endpoints utilizados pelo backend também estão definidos diretamente no `Backend.cpp`.
* O módulo tenta reconectar ao Wi-Fi antes dos envios caso não exista uma conexão ativa.
* A tentativa de conexão Wi-Fi possui um limite aproximado de 10 segundos.
* Caso não seja possível conectar à internet, o ESP32 continua executando o restante do sistema.
* `enviar_dados_bateria()` não envia dados quando `dados.tensao` possui o valor `NaN`.
* `enviar_alertas_bateria()` não envia informações quando `alerta_ativo` é falso.
* O envio das células percorre exatamente 16 posições do array `dados.celulas`.
* As estruturas utilizadas pela API são definidas externamente em `Estruturas.h`.
* O módulo utiliza comunicação HTTP e depende de uma conexão Wi-Fi funcional para que os dados possam chegar ao backend.
* As funções de envio exibem o código de resposta HTTP pela Serial, mas não retornam esse código para o módulo que realizou a chamada.
