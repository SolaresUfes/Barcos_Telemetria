# Orquestração e Testes

Esta pasta é o "cérebro" da operação. Enquanto a lógica de cada sensor fica bem guardada na pasta `lib/`, é aqui na `src/` (Source) que nós juntamos todas as peças para fazer o ESP32 rodar o projeto de verdade. 

Nenhuma funcionalidade pesada é criada aqui do zero, esta pasta serve apenas para ditar a ordem das coisas.

## O que temos aqui?

* **`main.cpp`**: O compilado geral do projeto. É o código oficial e final que vai embarcado no ESP32. Ele chama o módulo ADS para ler os dados físicos, o BMS para checar a bateria e, por fim, o módulo Backend para enviar tudo para o servidor. É a junção de todo o trabalho.

* **`teste.cpp`**: A área de rascunho. Serve para copiarmos e colarmos um código específico que queremos testar rápido, sem correr o risco de bagunçar o código principal que já está funcionando. Pode ser usado para testes aleatórios ou, ate mesmo, para testar os códigos específicos que temos aqui

**Aviso Importante para os Testes:** 
O ESP32 não consegue rodar dois códigos principais ao mesmo tempo. Quando for compilar usando o `teste.cpp`, lembre-se de desativar o `main.cpp` (você pode comentar o código todo ou renomear o arquivo para `main.txt` temporariamente). Se o sistema encontrar a função `setup()` e `loop()` nos dois arquivos, ele dará erro na hora de enviar para a placa.

**LEMBRE-SE:**
Se for programar algo por aqui, lembre-se de adicionar um `#include <Arduino.h>` no topo dos arquivos pra termos acesso as funções do Ardiono IDE!