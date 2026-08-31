# Módulos Funcionais (Bibliotecas)

Esta pasta não guarda apenas bibliotecas comuns, mas sim os **subsistemas completos** do nosso projeto. Cada subpasta aqui dentro representa uma "tarefa" ativa e independente que o ESP32 realiza.

A ideia de separar tudo em módulos é simples: se precisarmos alterar, por exemplo, como o Wi-Fi funciona, mexemos apenas no módulo do Backend, sem o risco de quebrar a leitura da bateria (BMS) ou dos sensores (ADS). Essa lógica se aplica a todos os arquivos daqui

## O que temos aqui?

* **`ADS/`**: O coletor de dados do ESP32: Lê os sensores físicos com precisão.
* **`BMS/`**: O gerenciador da bateria: Conversa com o sistema de energia para saber o estado da carga e se há algum problema.
* **`Backend/`**: O código de comunicação: Pega as informações coletadas e manda para o nosso servidor pela internet.

Para entender como cada um funciona por baixo dos panos, basta abrir a pasta correspondente e ler o seu próprio README.

Para testar cada código individualmente no ESP, use o arquivo `test.cpp` na pasta `/src` e cole o codigo que voce precisa testar. Ao final dos testes, caso algo seja modificado, altere os arquivos dentro de sua pasta específica, descomente o arquivo `/src/main.cpp` e envie as alterações para cá