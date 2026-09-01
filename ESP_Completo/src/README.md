# Orquestração do Sistema

A pasta `src/` é responsável pela **integração e execução principal do projeto**.

Enquanto os módulos localizados em `lib/` concentram funcionalidades específicas, como comunicação com o BMS, aquisição de dados analógicos e comunicação com o backend, é nesta pasta que essas funcionalidades são reunidas para formar o funcionamento completo do sistema.

A `src/` não deve concentrar a implementação detalhada das funcionalidades dos módulos. Sua principal responsabilidade é definir:

* Quais módulos serão utilizados;
* Como eles serão inicializados;
* Em que momento cada função será executada;
* Como os dados obtidos por um módulo serão utilizados por outro;
* Qual será a lógica principal de execução do ESP32.

Em outras palavras, esta pasta funciona como o ponto de **orquestração do sistema**.

---

## Estrutura

Atualmente, esta pasta contém o arquivo principal do projeto:

```text
src/
├── main.cpp
└── README.md
```

Durante o desenvolvimento, arquivos adicionais podem ser utilizados temporariamente para testes específicos.

---

# `main.cpp`

O arquivo `main.cpp` contém o código principal executado pelo ESP32.

É nele que os módulos do projeto são reunidos e utilizados em conjunto.

Atualmente, o arquivo principal utiliza:

```cpp
#include "Config.h"

#include "Backend.h"
#include "ADS.h"
#include "BMS.h"
```

Essas inclusões permitem que o código principal utilize as configurações compartilhadas e as interfaces públicas dos módulos necessários para o funcionamento do sistema.

---

## Responsabilidades

O `main.cpp` é responsável por:

* Inicializar a comunicação Serial;
* Inicializar o módulo BMS;
* Inicializar o módulo ADS;
* Conectar o ESP32 à rede Wi-Fi;
* Controlar o intervalo entre os ciclos de leitura;
* Solicitar os dados gerais da bateria;
* Solicitar os alertas do BMS;
* Solicitar os dados individuais das células;
* Enviar essas informações ao backend.

O processamento interno dessas funcionalidades permanece nos respectivos módulos.

---

# Configuração Utilizada

O arquivo principal inclui:

```cpp
#include "Config.h"
```

Isso permite utilizar configurações compartilhadas sem definir diretamente esses valores dentro do `main.cpp`.

Atualmente, o arquivo utiliza configurações como:

* `BAUD_SERIAL`;
* `SDA_ADS`;
* `SCL_ADS`.

Essa organização permite centralizar configurações importantes do projeto em um único local.

> A documentação completa das configurações disponíveis pertence ao arquivo e à documentação correspondente ao `Config.h`.

---

# Inicialização do Sistema

A inicialização ocorre dentro da função:

```cpp
void setup()
```

Atualmente, o processo de inicialização é dividido nas seguintes etapas.

## 1. Inicialização da Serial

A comunicação Serial é iniciada utilizando:

```cpp
Serial.begin(BAUD_SERIAL);
```

O valor da taxa de comunicação é obtido através do arquivo `Config.h`.

A Serial é utilizada pelos módulos para mensagens relacionadas ao funcionamento, inicialização e comunicação do sistema.

---

## 2. Inicialização do BMS

O módulo responsável pela comunicação com o sistema de gerenciamento da bateria é inicializado através de:

```cpp
iniciar_BMS();
```

Após essa etapa, as funções responsáveis pela leitura dos dados, alertas e células podem ser utilizadas pelo sistema.

---

## 3. Inicialização do ADS

O módulo ADS é inicializado utilizando:

```cpp
iniciar_ADS(SDA_ADS, SCL_ADS);
```

Os pinos utilizados para a comunicação I2C são obtidos através das configurações centralizadas no projeto.

---

## 4. Conexão Wi-Fi

A conexão com a rede é iniciada através de:

```cpp
conectar_wifi();
```

Essa função pertence ao módulo `Backend`.

A responsabilidade pela conexão e gerenciamento do Wi-Fi permanece dentro desse módulo, enquanto o `main.cpp` apenas solicita sua inicialização.

---

# Execução Principal

A execução contínua do sistema ocorre dentro da função:

```cpp
void loop()
```

O código principal utiliza:

```cpp
millis()
```

para controlar o intervalo entre os ciclos de leitura.

A configuração atual define:

```cpp
const unsigned long intervalo_leitura = 2000;
```

Portanto, o conjunto principal de leituras e envios é executado aproximadamente a cada **2 segundos**.

---

# Controle de Tempo

O controle do intervalo utiliza duas variáveis principais:

```cpp
unsigned long tempo_anterior = 0;
const unsigned long intervalo_leitura = 2000;
```

Durante cada execução do `loop()`, o sistema obtém o tempo atual:

```cpp
unsigned long tempo_atual = millis();
```

Em seguida, verifica se o intervalo configurado já foi atingido:

```cpp
if (tempo_atual - tempo_anterior >= intervalo_leitura)
```

Quando o intervalo é atingido, um novo ciclo de leitura é executado.

Após iniciar esse ciclo, o valor de referência é atualizado:

```cpp
tempo_anterior = tempo_atual;
```

Esse método permite controlar a frequência de execução sem utilizar um `delay()` bloqueante.

---

# Ciclo Principal de Operação

Quando o intervalo configurado é atingido, o `main.cpp` executa três grupos principais de operações.

## Dados Gerais da Bateria

Inicialmente, o sistema solicita os dados gerais ao módulo BMS:

```cpp
DADOS_BATERIA BMS_dados = ler_dados_bms();
```

Os dados obtidos são enviados para o backend:

```cpp
enviar_dados_bateria(BMS_dados);
```

A estrutura `DADOS_BATERIA` funciona como a ligação entre a aquisição dos dados e seu envio ao servidor.

---

## Alertas

Em seguida, o sistema solicita os alertas ao módulo BMS:

```cpp
ALERTAS_BATERIA BMS_alertas = ler_alertas_bms();
```

Os resultados são enviados utilizando:

```cpp
enviar_alertas_bateria(BMS_alertas);
```

Dessa forma, o módulo principal não precisa interpretar individualmente os dados relacionados às falhas.

A interpretação é realizada pelo módulo BMS, enquanto o módulo Backend é responsável pela organização e transmissão das informações.

---

## Dados das Células

Por fim, o sistema solicita os dados individuais das células:

```cpp
CELULAS_INDIVIDUAIS BMS_celulas = ler_celulas_bms();
```

Os valores são enviados ao backend através de:

```cpp
enviar_dados_celulas(BMS_celulas);
```

Assim como nos outros casos, o `main.cpp` apenas integra os módulos responsáveis pela obtenção e transmissão das informações.

---

# Integração Entre os Módulos

O arquivo principal utiliza os módulos de acordo com suas responsabilidades.

| Módulo    | Utilização no `main.cpp`                          |
| --------- | ------------------------------------------------- |
| `BMS`     | Inicialização e obtenção dos dados da bateria     |
| `ADS`     | Inicialização da aquisição analógica              |
| `Backend` | Conexão Wi-Fi e envio das informações ao servidor |
| `Config`  | Fornecimento de configurações compartilhadas      |

Essa divisão mantém o arquivo principal focado na integração do sistema.

O `main.cpp` não precisa conter:

* A implementação da comunicação com o BMS;
* A lógica interna de comunicação I2C do ADS;
* A implementação da conexão Wi-Fi;
* A criação detalhada das requisições HTTP;
* A construção dos documentos JSON.

Essas responsabilidades permanecem nos módulos correspondentes.

---

# Dependências

O arquivo principal inclui diretamente:

```cpp
#include "Config.h"

#include "Backend.h"
#include "ADS.h"
#include "BMS.h"
```

Também existem bibliotecas incluídas diretamente no arquivo:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
```

Essas bibliotecas estão relacionadas às funcionalidades utilizadas pelo projeto.

Algumas inclusões adicionais aparecem comentadas no código atual, indicando recursos que não são utilizados diretamente pelo `main.cpp` na versão atual.

Sempre que possível, o arquivo principal deve incluir apenas as dependências necessárias para seu funcionamento direto.

---

# Exemplo Simplificado da Organização

De forma conceitual, a responsabilidade do `main.cpp` pode ser representada pelo seguinte processo:

1. Inicializar os recursos necessários;
2. Inicializar os módulos do projeto;
3. Aguardar o intervalo configurado;
4. Solicitar os dados necessários aos módulos;
5. Entregar os dados ao módulo responsável pelo envio;
6. Repetir o processo continuamente.

A implementação específica de cada operação deve permanecer isolada dentro do módulo responsável.

---

# Testes Durante o Desenvolvimento

Durante o desenvolvimento, esta pasta também pode ser utilizada para testes individuais de funcionalidades.

Um arquivo temporário de teste pode ser criado para verificar uma parte específica do sistema sem modificar permanentemente o código principal.

Por exemplo, podem ser realizados testes isolados de:

* Comunicação com o BMS;
* Leitura de dados específicos;
* Comunicação com o ADS;
* Conexão Wi-Fi;
* Envio de requisições HTTP;
* Integração entre dois módulos.

É importante lembrar que um projeto Arduino/ESP32 não pode possuir múltiplas implementações concorrentes das funções:

```cpp
setup()
loop()
```

Caso exista outro arquivo `.cpp` contendo essas duas funções durante a compilação, ocorrerá um conflito com o `main.cpp`.

Portanto, arquivos temporários de teste devem ser removidos, desativados ou organizados de forma que não sejam compilados juntamente com o programa principal.

---

# Manutenção do `main.cpp`

Ao adicionar uma nova funcionalidade ao projeto, é recomendado avaliar primeiro onde essa funcionalidade deve ser implementada.

A lógica recomendada é:

* Se a funcionalidade possui uma responsabilidade própria, ela deve ser implementada em um módulo;
* O módulo deve disponibilizar sua interface através de um arquivo `.h`;
* A implementação deve permanecer no arquivo `.cpp`;
* O `main.cpp` deve apenas incluir o módulo e organizar sua utilização.

Essa abordagem evita que o arquivo principal cresça excessivamente e concentre funcionalidades que deveriam estar separadas.

---

# Observações

* A pasta `src/` é responsável pela integração e execução principal do projeto.
* O `main.cpp` funciona como o ponto central de orquestração dos módulos.
* As funcionalidades específicas devem permanecer implementadas nos módulos correspondentes.
* As configurações compartilhadas são obtidas através de `Config.h`.
* O sistema utiliza `millis()` para controlar o intervalo entre os ciclos principais.
* O intervalo atual de leitura está configurado para aproximadamente 2000 ms.
* O ciclo principal obtém dados gerais, alertas e informações das células através do módulo BMS.
* As informações obtidas são enviadas utilizando o módulo Backend.
* O módulo ADS é inicializado durante o `setup()`, embora não seja chamado diretamente durante o ciclo principal atual.
* Arquivos temporários de teste devem ser organizados para evitar conflitos com as funções `setup()` e `loop()`.
* Alterações nas responsabilidades internas dos módulos devem ser feitas preferencialmente dentro das respectivas pastas em `lib/`.
