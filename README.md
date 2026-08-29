# Firmware ESP32

Este diretório contém os códigos-fonte do ESP32. A arquitetura foi modularizada para permitir o teste individual de cada "tarefa", facilitando o debug e a manutenção sem quebrar funcionalidades já estáveis.

## Estrutura de Módulos (`/ESP_Completo`)

* **`main.cpp`**
  O código principal. Faz a junção de todos os fragmentos e orquestra o fluxo de execução do ESP32.

* **`ADS.cpp`**
  Módulo de coleta de dados. Lida diretamente com a leitura e processamento das informações do ADS.

* **`BMS.cpp`**
  Gerenciamento da bateria. Define como é feita a coleta de dados do BMS e quais informações são requisitadas.

* **`Backend.cpp`**
  Comunicação externa. Isola a lógica de envio e recebimento de dados entre o ESP32 e o backend.

## Padrão de Código

Cada módulo foi escrito com foco máximo em legibilidade. Trechos mais complexos possuem linhas de comentários extensas e detalhadas. O objetivo é tornar o código autoexplicativo e eliminar a necessidade de pesquisar documentações externas para entender funções específicas.