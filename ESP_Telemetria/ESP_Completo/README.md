# Firmware ESP32

Este diretório contém os códigos-fonte do ESP32, modularizados para facilitar testes, debug e reaproveitamento de código sem quebrar funcionalidades já estáveis.

## Estrutura do Projeto

### `/src` (Execução e Testes)
* **`main.cpp`**
  O código principal. Faz a junção de todos os módulos e orquestra o fluxo de execução do ESP32.
* **`teste.cpp`**
  Arquivo dedicado para testes rápidos e isolados. Use esse arquivo para testar as alterações nos arquivos isolados de `ADS.cpp`, `BMS.cpp` ou `Backend.cpp`. Ao terminar os testes, comente completamente esse arquivo de código. (Nota: Ao compilar algum código, certifique que `main.cpp` esteja completamente comentada para evitar conflito de múltiplas declarações de `setup` e `loop`)

### `/lib` (Módulos Secundários)
Nesta pasta ficam os códigos das funcionalidades individuais que o ESP tem:

* **`ADS/`**
  Contém a lógica completa de leitura e processamento de dados coletados pelo ADS.
* **`BMS/`**
  Executa a comunicação direta para a coleta de dados do BMS e requisição de parâmetros da bateria.
* **`Backend/`**
  Lida com toda a interação de envio e recebimento de informações entre o ESP32 e o backend.

## Padrão de Código

Cada módulo foi escrito com foco máximo em legibilidade. Trechos mais complexos possuem linhas de comentários extensas e detalhadas. O objetivo é tornar o código autoexplicativo e eliminar a necessidade de pesquisar documentações externas para entender funções específicas.