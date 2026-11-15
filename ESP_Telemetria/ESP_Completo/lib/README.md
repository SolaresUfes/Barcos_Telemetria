# Módulos Funcionais

Esta pasta não guarda apenas bibliotecas comuns, mas sim os **subsistemas funcionais do projeto**.

Cada subpasta representa uma responsabilidade específica do sistema. Os módulos foram separados para que cada parte possa cuidar de sua própria tarefa, mantendo a lógica do projeto organizada e reduzindo o acoplamento entre diferentes funcionalidades.

Por exemplo, alterações na comunicação com o Wi-Fi e o servidor podem ser realizadas no módulo `Backend` sem a necessidade de modificar diretamente a lógica responsável pela leitura da bateria no módulo `BMS` ou pela aquisição dos sinais analógicos no módulo `ADS`.

Essa organização facilita a manutenção, os testes e a expansão do projeto.

---

## Estrutura

Atualmente, esta pasta contém os seguintes módulos:

```text
lib/
├── ADS/
│   ├── ADS.h
│   ├── ADS.cpp
│   └── README.md
│
├── BMS/
│   ├── BMS.h
│   ├── BMS.cpp
│   └── README.md
│
└── Backend/
    ├── Backend.h
    ├── Backend.cpp
    └── README.md
```

Cada módulo possui sua própria interface, implementação e documentação.

| Arquivo     | Responsabilidade                                                   |
| ----------- | ------------------------------------------------------------------ |
| `.h`        | Declara a interface pública do módulo                              |
| `.cpp`      | Implementa o funcionamento interno                                 |
| `README.md` | Documenta a responsabilidade, utilização e funcionamento do módulo |

---

# Módulos Disponíveis

## `ADS`

O módulo `ADS` é responsável pela **aquisição de sinais analógicos** utilizando o conversor analógico-digital ADS1115.

Entre suas principais responsabilidades estão:

* Inicialização da comunicação I2C;
* Inicialização do ADS1115;
* Leitura dos canais configurados;
* Realização de múltiplas leituras para cálculo de médias;
* Conversão das leituras para tensão;
* Aplicação opcional de um offset experimental;
* Retorno dos dados através das estruturas utilizadas pelo projeto.

Esse módulo concentra toda a lógica relacionada à aquisição dos sinais analógicos, evitando que outros arquivos precisem interagir diretamente com a biblioteca do ADS1115.

Para informações detalhadas sobre suas funções e utilização, consulte:

```text
ADS/README.md
```

---

## `BMS`

O módulo `BMS` é responsável pela **comunicação com o Battery Management System** utilizado pelo sistema.

Sua função é solicitar, receber e interpretar as informações fornecidas pelo sistema de gerenciamento da bateria.

O módulo disponibiliza funções para obter:

* Dados gerais da bateria;
* Informações relacionadas a falhas e alertas;
* Dados individuais das células.

A lógica de interpretação das respostas recebidas também fica concentrada nesse módulo, permitindo que o restante do projeto utilize estruturas de dados sem precisar manipular diretamente os dados brutos da comunicação.

Para informações detalhadas sobre suas funções e utilização, consulte:

```text
BMS/README.md
```

---

## `Backend`

O módulo `Backend` é responsável pela **comunicação do ESP32 com a rede e com o servidor do projeto**.

Ele concentra a lógica relacionada à conexão Wi-Fi e ao envio das informações coletadas pelo sistema através de requisições HTTP.

Entre suas responsabilidades estão:

* Conexão do ESP32 à rede Wi-Fi;
* Verificação do estado da conexão;
* Tentativas de reconexão quando necessárias;
* Criação de documentos JSON;
* Envio de dados gerais da bateria;
* Envio de alertas;
* Envio de dados individuais das células;
* Comunicação com os endpoints configurados no backend.

Esse módulo permite que os demais subsistemas forneçam suas informações sem precisar lidar diretamente com detalhes de Wi-Fi, HTTP ou JSON.

Para informações detalhadas sobre suas funções e utilização, consulte:

```text
Backend/README.md
```

---

# Organização do Projeto

Os módulos foram separados de acordo com suas responsabilidades.

| Módulo    | Responsabilidade principal                            |
| --------- | ----------------------------------------------------- |
| `ADS`     | Aquisição e processamento de sinais analógicos        |
| `BMS`     | Comunicação e obtenção das informações da bateria     |
| `Backend` | Comunicação Wi-Fi e envio das informações ao servidor |

Essa divisão permite que cada parte do sistema seja desenvolvida e modificada de forma mais independente.

Por exemplo:

* Alterações na aquisição analógica devem ficar concentradas no módulo `ADS`;
* Alterações na comunicação com o sistema de gerenciamento da bateria devem ficar concentradas no módulo `BMS`;
* Alterações relacionadas ao Wi-Fi, HTTP ou backend devem ficar concentradas no módulo `Backend`.

A intenção é evitar que uma modificação em uma funcionalidade exija alterações desnecessárias nas outras.

---

# Comunicação Entre os Módulos

Embora os módulos possuam responsabilidades separadas, eles fazem parte do mesmo sistema.

De forma geral:

* O módulo `ADS` fornece informações obtidas através das entradas analógicas;
* O módulo `BMS` fornece informações relacionadas ao estado da bateria;
* O módulo `Backend` pode receber as informações produzidas pelos outros módulos para enviá-las ao servidor.

As estruturas utilizadas para transportar informações entre diferentes partes do projeto podem estar definidas fora desses módulos, permitindo que os dados sejam compartilhados sem duplicar definições.

Cada módulo deve continuar responsável apenas pela sua própria funcionalidade.

---

# Estrutura Interna dos Módulos

A organização dos módulos segue o padrão de separação entre interface e implementação.

## Arquivos `.h`

Os arquivos `.h` funcionam como a **interface pública** dos módulos.

Eles contêm as declarações necessárias para que outros arquivos possam utilizar as funcionalidades disponibilizadas pelo módulo.

Normalmente, incluem:

* Declarações de funções públicas;
* Tipos necessários para a interface;
* Estruturas ou dependências utilizadas pela API.

Outros módulos não precisam conhecer todos os detalhes internos da implementação para utilizar essas funções.

---

## Arquivos `.cpp`

Os arquivos `.cpp` contêm a implementação das funcionalidades declaradas nos respectivos arquivos `.h`.

É nessa parte que ficam concentrados os detalhes internos necessários para o funcionamento de cada módulo.

Essa separação permite que a interface utilizada pelo restante do projeto permaneça organizada enquanto os detalhes internos continuam isolados dentro da implementação.

---

# Documentação Individual

Cada módulo possui seu próprio `README.md`.

Os READMEs individuais documentam informações específicas que não precisam ser repetidas neste arquivo, como:

* Dependências;
* Bibliotecas utilizadas;
* Hardware e interfaces;
* Configurações;
* Funções disponíveis;
* Parâmetros;
* Valores retornados;
* Estruturas utilizadas;
* Exemplos de utilização;
* Observações e limitações.

Portanto, este README funciona como uma visão geral da arquitetura dos módulos, enquanto os READMEs internos documentam cada subsistema individualmente.

---

# Manutenção e Expansão

A organização desta pasta foi pensada para facilitar a evolução do projeto.

Ao adicionar uma nova funcionalidade, é recomendado avaliar se ela pertence a um módulo existente ou se representa uma nova responsabilidade do sistema.

Quando uma funcionalidade possuir uma responsabilidade suficientemente independente, pode ser criado um novo módulo seguindo a mesma organização:

```text
NovoModulo/
├── NovoModulo.h
├── NovoModulo.cpp
└── README.md
```

Dessa forma, o projeto pode crescer mantendo uma estrutura previsível e consistente.

---

# Observações

* Esta pasta contém módulos funcionais do projeto, e não apenas bibliotecas genéricas.
* Cada módulo possui uma responsabilidade específica.
* A implementação interna deve permanecer concentrada no respectivo arquivo `.cpp`.
* A interface utilizada pelos outros módulos deve ser disponibilizada através do arquivo `.h`.
* Cada módulo possui um README próprio com sua documentação detalhada.
* Este README apresenta apenas a visão geral da organização e das responsabilidades dos módulos.
* Alterações na API de um módulo devem ser refletidas em sua documentação individual.
* Novos módulos devem seguir, sempre que possível, o mesmo padrão de organização.
