# Biblioteca `CONFIG` — Configuração e Diagnóstico LoRa (`Ebyte E220-900T30D`)

Documentação técnica da biblioteca responsável pela parametrização e auditoria dos transceptores LoRa utilizados no sistema de telemetria da equipe **Solares UFES** (embarcação e estação base em terra).

---

## 1. Datasheet Oficial e Especificações do Módulo (`E220-900T30D`)

O módulo utilizado no projeto é o **Ebyte E220-900T30D**, baseado no transceptor **Semtech LLCC68** com amplificador de potência (**PA**) e amplificador de baixo ruído (**LNA**) integrados.

* **Manual do Usuário / Datasheet Oficial (PDF):** [Ebyte E220-900T30D User Manual (cdebyte.com)](https://www.cdebyte.com/pdf-down.aspx?id=349)

### Resumo das Especificações Elétricas e de RF

| Parâmetro | Especificação Oficial (`E220-900T30D`) |
| :--- | :--- |
| **Chipset RF** | Semtech LLCC68 + PA/LNA integrados |
| **Faixa de Frequência** | $850.125\text{ MHz}$ a $930.125\text{ MHz}$ (Padrão de fábrica: $873.125\text{ MHz}$ / Canal `23`) |
| **Potência Máxima de TX** | $30\text{ dBm}$ ($1\text{ W}$) — ajustável em $30$, $27$, $24$ ou $21\text{ dBm}$ |
| **Tensão de Alimentação (`VCC`)** | $3.0\text{ V}$ a $5.5\text{ V}$ DC *(recomendado $5.0\text{ V}$ para atingir $30\text{ dBm}$)* |
| **Nível Lógico UART (`RXD`/`TXD`/`M0`/`M1`)** | TTL $3.3\text{ V}$ / $5\text{ V}$ (compatível direto com ESP32 / ESP32-S3) |
| **Corrente de Transmissão (`TX`)** | $460\text{ mA}$ a $620\text{ mA}$ (pico instantâneo em $30\text{ dBm}$) |
| **Corrente de Recepção (`RX`)** | $\approx 13\text{ mA}$ a $17.2\text{ mA}$ |
| **Corrente em Deep Sleep (Modo 3)** | $\approx 5\,\mu\text{A}$ |
| **Taxa de Dados no Ar (*Air Data Rate*)** | $2.4\text{ kbps}$ a $62.5\text{ kbps}$ |
| **Buffer Interno** | $400\text{ bytes}$ (sub-pacotes de $200$, $128$, $64$ ou $32\text{ bytes}$) |
| **Conector de Antena** | SMA-K ($50\,\Omega$) |

---

## 2. Por que este código existe e como se organiza?

Diferente de módulos SPI puros (como o SX1276/RFM95), o **E220-900T30D** possui um microcontrolador interno que gerencia a modulação LoRa e recebe comandos via **UART**. Sem configurar seus registradores internos:
1. Ele opera fora da faixa ISM brasileira permitida pela ANATEL ($902\text{--}928\text{ MHz}$).
2. Fica vulnerável a interferências de outros rádios na mesma frequência durante competições.
3. Não entrega informações de qualidade de sinal (**RSSI**) nem permite endereçamento individual entre embarcações.

### Arquitetura no Repositório (`ESP_Telemetria/Lora`)

```text
Lora/
├── include/
│   ├── Config.h        <-- Definições globais de pinos (RX, TX, M0, M1) e Baud Rates
│   └── Estruturas.h    <-- Enums tipados (enum class) e struct LoRaConfig
├── lib/
│   └── CONFIG/
│       ├── CONFIG.h    <-- Protótipos das funções de configuração, modo e leitura
│       ├── CONFIG.cpp  <-- Empacotamento de bits, envio UART e auditoria da resposta
│       └── README.md   <-- Esta documentação
```

---

## 3. Conexão de Hardware e Modos de Operação (`M0` e `M1`)

### Pinagem na Bancada de Configuração

| Pino do Módulo LoRa | Pino no ESP32 | Cor do Chicote | Descrição |
| :--- | :--- | :--- | :--- |
| **TXD** | `GPIO 16` (`RX_CONFIG`) | Laranja | Saída serial do LoRa $\rightarrow$ Entrada RX do ESP32 |
| **RXD** | `GPIO 17` (`TX_CONFIG`) | Amarelo | Entrada serial do LoRa $\leftarrow$ Saída TX do ESP32 |
| **M0** | `GPIO 18` (`M0_CONFIG`) | Azul | Seleção de modo de operação (bit 0) |
| **M1** | `GPIO 19` (`M1_CONFIG`) | Verde | Seleção de modo de operação (bit 1) |
| **VCC** | `5V` (`VIN`) | Vermelho | Alimentação principal (suporta picos de $620\text{ mA}$) |
| **GND** | `GND` | Preto | Referência comum |

### Tabela Verdade dos Modos (`M1` e `M0`)

| Modo | `M1` | `M0` | Nome | Comportamento do Rádio |
| :---: | :---: | :---: | :--- | :--- |
| **0** | `0` (`LOW`) | `0` (`LOW`) | **Normal** | Transmissão e recepção RF ativas (operação padrão do barco/base). |
| **1** | `0` (`LOW`) | `1` (`HIGH`) | **WOR Transmissor** | Envia preâmbulo longo para acordar receptores em modo economia. |
| **2** | `1` (`HIGH`) | `0` (`LOW`) | **WOR Receptor** | Rádio dorme e acorda periodicamente para escutar pacotes. |
| **3** | `1` (`HIGH`) | `1` (`HIGH`) | **Sleep / Configuração** | **RF desligado. UART travada em `9600 bps 8N1` para gravar/ler registradores.** |

---

## 4. Protocolo Serial de Configuração

No **Modo 3 (`M0 = 1`, `M1 = 1`)**, o módulo escuta comandos na UART obrigatoriamente a **`9600 bps`, 8 bits de dados, sem paridade, 1 stop bit (`8N1`)** no formato:

```text
[ Cabeçalho ] [ Endereço Inicial ] [ Quantidade de Bytes ] [ Dado 0 ] [ Dado 1 ] ... [ Dado N ]
```

* **`0xC0` — Gravar na EEPROM (Permanente):** Salva os parâmetros na memória não-volátil. Mantém a configuração mesmo após desligar a alimentação.
* **`0xC2` — Gravar na RAM (Temporário):** Aplica os parâmetros apenas até o próximo reset/desligamento.
* **`0xC1` — Ler / Confirmar:** Usado no comando de leitura (`0xC1 0x00 0x08`) e também retornado pelo rádio como confirmação após uma gravação `0xC0` ou `0xC2`.
* **`0xFF 0xFF 0xFF` — Erro de Formato:** Resposta enviada pelo chip caso o comando tenha tamanho incorreto ou parâmetros inválidos.

---

## 5. Mapa Completo dos Registradores (`00H` a `07H`)

O quadro enviado pela função `LORA_configurar_modulo()` possui **11 bytes**: 3 bytes de cabeçalho (`0xC0 0x00 0x08`) + **8 bytes de registradores** (`00H` até `07H`).

### `00H` (`ADDH`) e `01H` (`ADDL`) — Endereço Lógico do Módulo (`uint16_t address`)
* **Faixa:** `0x0000` a `0xFFFF` ($65.536$ combinações).
* **Divisão de bytes:**
  * `ADDH` (`00H`) = `(address >> 8) & 0xFF` (byte mais significativo).
  * `ADDL` (`01H`) = `address & 0xFF` (byte menos significativo).
* **Regras de endereçamento:**
  * **Modo Transparente:** Transmissor e receptor precisam ter exatamente o mesmo `address` e o mesmo `channel`.
  * **Endereços `0x0000` e `0xFFFF`:** Atuam como **Broadcast / Monitor** (ver Seção 6).

---

### `02H` (`REG0`) — Velocidade Serial e Taxa de Transmissão no Ar

| Bits | Campo na `LoRaConfig` | Valores Possíveis |
| :---: | :--- | :--- |
| **7:5** | `uartBaud` | `000`: 1200 \| `001`: 2400 \| `010`: 4800 \| **`011`: 9600 (padrão)** \| `100`: 19200 \| `101`: 38400 \| `110`: 57600 \| `111`: 115200 bps |
| **4:3** | `uartParity` | **`00`: 8N1 (padrão)** \| `01`: 8O1 \| `10`: 8E1 \| `11`: 8N1 |
| **2:0** | `airDataRate` | **`010`: 2.4 kbps (padrão)** \| `011`: 4.8 kbps \| `100`: 9.6 kbps \| `101`: 19.2 kbps \| `110`: 38.4 kbps \| `111`: 62.5 kbps |

* **Trade-off na telemetria:** Taxas de ar menores (`2.4 kbps`) aumentam o fator de espalhamento (*Spreading Factor*), garantindo **alcance máximo e alta imunidade a reflexões na superfície da água**. Taxas maiores (`9.6 kbps` ou `19.2 kbps`) reduzem a latência para envio em alta frequência.

---

### `03H` (`REG1`) — Tamanho de Sub-pacote, Ruído Ambiente e Potência RF

| Bits | Campo na `LoRaConfig` | Valores Possíveis |
| :---: | :--- | :--- |
| **7:6** | `packetSize` | **`00`: 200 bytes** \| `01`: 128 bytes \| `10`: 64 bytes \| `11`: 32 bytes |
| **5** | `enableAmbientRssi` | `false` (`0`): Desabilitado \| `true` (`1`): Habilitado (permite ler ruído de fundo do canal) |
| **4:2** | *Reservado* | Fixo em `000` |
| **1:0** | `txPower` | `00` (`Level0_Max`): **$30\text{ dBm}$ ($1\text{ W}$)** \| `01` (`Level1_High`): **$27\text{ dBm}$ ($500\text{ mW}$)** \| `10` (`Level2_Mid`): **$24\text{ dBm}$ ($250\text{ mW}$)** \| `11` (`Level3_Low`): **$21\text{ dBm}$ ($125\text{ mW}$)** |

---

### `04H` (`REG2`) — Canal Físico de Frequência (`uint8_t channel`)
* **Faixa:** `0` a `83` (`0x00` a `0x53`).
* **Equação de sintonia:**
  $$f_{\text{MHz}} = 850.125 + \text{channel} \times 1.0$$
* **Canais legais no Brasil (Faixa ISM ANATEL: $902\text{--}907.5\text{ MHz}$ e $915\text{--}928\text{ MHz}$):**
  * `channel = 65` (`0x41`) $\rightarrow$ **$915.125\text{ MHz}$** (padrão configurado na biblioteca)
  * `channel = 68` (`0x44`) $\rightarrow$ **$918.125\text{ MHz}$**
  * `channel = 73` (`0x49`) $\rightarrow$ **$923.125\text{ MHz}$**

---

### `05H` (`REG3`) — Recursos Avançados de Transmissão

| Bit | Campo na `LoRaConfig` | Efeito no Comportamento do Rádio |
| :---: | :--- | :--- |
| **7** | `enablePacketRssi` | `true`: Anexa **1 byte extra** ao final de cada pacote recebido indicando a intensidade do sinal (RSSI). |
| **6** | `fixedTransmission` | `false`: **Modo Transparente** (envia direto o que entra na UART). `true`: **Modo Fixo** (exige 3 bytes de destino antes do payload). |
| **5** | *Reservado* | Fixo em `0` |
| **4** | `enableLbt` | `true`: **Listen Before Talk** — escuta o canal por até $2\text{ s}$ antes de transmitir para evitar colisões. |
| **3** | `worTransmitter` | `true`: Define o rádio como transmissor *Wake-on-Radio* (Modo 1). |
| **2:0** | `worCycle` | Intervalo de despertar no modo WOR: `000` ($500\text{ ms}$) até `111` ($4000\text{ ms}$) em passos de $500\text{ ms}$. |

---

### `06H` (`CRYPT_H`) e `07H` (`CRYPT_L`) — Chave de Criptografia (`uint16_t encryptionKey`)
* **Faixa:** `0x0000` a `0xFFFF`.
* **Funcionamento:** Registradores **somente escrita** (ao ler com `0xC1`, o módulo sempre retorna `0x00 0x00` por segurança). Apenas módulos gravados com a exata mesma chave conseguem decodificar os pacotes.

---

## 6. Pegadinhas Críticas do `E220-900T30D` (Cuidados Obrigatórios)

1. **Fonte de Alimentação para $30\text{ dBm}$ (Pico de $620\text{ mA}$):**
   * Embora aceite $3.0\text{ V}$ a $5.5\text{ V}$, o datasheet especifica que o módulo **só entrega $30\text{ dBm}$ alimentado em $5\text{ V}$** e consome um pico instantâneo de até **$620\text{ mA}$** durante a transmissão.
   * **Nunca alimente o `VCC` do LoRa pelo pino `3.3V` do ESP32 em potência máxima:** a queda de tensão (*brownout*) reinicia o microcontrolador ou corrompe a transmissão. Ligue o `VCC` no barramento **`5V`** com capacitores de desacoplamento próximos ao módulo.
2. **Pull-up Interno nos Pinos `M0` e `M1`:**
   * No `E220-900T30D`, os pinos `M0` e `M1` possuem resistores de **pull-up fraco internos**. Se forem deixados desconectados ("flutuando"), eles assumem nível alto (`1, 1`), travando o módulo no **Modo 3 (Sleep/Configuração)** onde o rádio RF fica desligado.
   * Nos códigos `EMISSOR` e `RECEPTOR`, sempre conecte `M0` e `M1` ao `GND` ou force ambos em `LOW` via código.
3. **Endereços `0x0000` e `0xFFFF` Funcionam como "Sniffer":**
   * Segundo o manual da Ebyte, qualquer módulo configurado com endereço `0x0000` ou `0xFFFF` entra em **modo monitor** e recebe pacotes de *todos* os transmissores no mesmo canal, independentemente do endereço de origem. Para isolar enlaces específicos, utilize endereços entre `0x0001` e `0xFFFE`.
4. **Nunca Transmita sem Antena Conectada:**
   * Por possuir um amplificador de potência de $1\text{ W}$ ($30\text{ dBm}$), disparar pacotes sem uma antena de $915\text{ MHz}$ rosqueada no conector SMA causa reflexão de potência que pode danificar permanentemente o estágio de saída RF.
5. **Conflito de Case no Windows (`Config.h` vs `CONFIG.h`):**
   * Como o sistema de arquivos do Windows não diferencia maiúsculas de minúsculas, o arquivo `lib/CONFIG/CONFIG.h` deve incluir os headers globais utilizando caminho relativo explícito (`#include "../../include/Config.h"`).

---

## 7. O que é possível fazer na prática?

* **Enlace Transparente Barco $\leftrightarrow$ Base:** Configure ambos os rádios com o mesmo `address` (ex.: `0x0001`), `channel = 65` e `fixedTransmission = false`. Todo dado escrito na `Serial2` do barco sai idêntico na `Serial2` da base.
* **Telemetria Multi-Barcos (`fixedTransmission = true`):** Atribua `0x0001` ao Barco 1, `0x0002` ao Barco 2 e `0x0000` à Base. Ao enviar dados, os **3 primeiros bytes** enviados na UART indicam o destino (`[ADDH_Destino] [ADDL_Destino] [Canal_Destino]`), seguidos da mensagem.
* **Mapa de Cobertura de Sinal (`enablePacketRssi = true`):** Com esse flag ativo no receptor, o último byte de cada pacote recebido informa o RSSI do enlace, permitindo monitorar a intensidade do sinal ao longo da raia.
* **Imunidade em Competições (`encryptionKey` + `enableLbt`):** Configurar uma `encryptionKey` exclusiva da equipe impede que pacotes de outras equipes no mesmo canal corrompam o parser de telemetria, enquanto o `LBT` reduz colisões em ambientes congestionados.

---

## 8. Exemplo de Uso (`src/main.cpp`)

```cpp
#include <Arduino.h>
#include "CONFIG.h"

void setup() {
  Serial.begin(BAUD_SERIAL);
  delay(500);

  LoRaConfig configBarco;
  configBarco.address           = 0x0001;                    // Endereço exclusivo do barco
  configBarco.uartBaud          = LoRaUartBaud::Baud9600;    // Serial em 9600 bps
  configBarco.airDataRate       = LoRaAirDataRate::Rate2_4k; // Alcance máximo na água
  configBarco.txPower           = LoRaTxPower::Level0_Max;   // 30 dBm (1W) - exige VCC em 5V!
  configBarco.channel           = 65;                        // 915.125 MHz (ISM Brasil)
  configBarco.enablePacketRssi  = true;                      // Anexa byte de RSSI no receptor
  configBarco.fixedTransmission = false;                     // Modo transparente
  configBarco.enableLbt         = true;                      // Escuta canal antes de transmitir
  configBarco.encryptionKey     = 0x2026;                    // Chave privada da equipe

  // Grava na EEPROM permanente (true) e valida a resposta do módulo
  if (LORA_configurar_modulo(configBarco, true)) {
    LORA_ler_configuracao(); // Imprime diagnóstico completo dos registradores
  }
}

void loop() {
  // Ao sair de LORA_configurar_modulo(), o rádio já está em Modo Normal (M0=0, M1=0)
  Serial2.println("SOLARES_UFES_TELEMETRIA_OK");
  delay(1000);
}
```