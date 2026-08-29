Os arquivos dessa pasta são os arquivos do ESP32.


Dentro da pasta "ESP_Completo", temos os arquivos dos codigos individuais de cada funcao que o ESP32 faz:

1. ADS.cpp:
    Arquivo do codigo que lida com o ADS. Nele, podemos ver como é feita a coleta de dados do ADS pelo ESP32.

2. Backend.cpp:
    Arquivo da comunicação do ESP32 com o backend. É possível destrinchar a cominicação por lá e testar.

3. BMS.cpp:
    Código da utilização do BMS para coleta de dados usando ESP32. Pode-se ver como é feita a coleta dos dados e quais dados são requisitados.

4. main.cpp:
    O código completo do ESP32. Nele, temos a junção de todos os fragmentos códigos que compõem o código completo.


A intenção de fazer a pasta assim foi para podermos testar individualmente cada "tarefa" que o ESP32 faz. É possível realizar testes e fazer debug
de coisas com mais facilidade e podermos mudar o codigo sem alterar outras funcionalidades quee já estiverem funcionando.

Cada código é feito para ter o máximo de compreensão possível. Isso se torna visível quando vemos algum codigo com extensas linhas de comentário.
Nem sempre os comentários extensos são necessários, mas eles visam tirar a necessidade de pesquisar muito sobre uma função específica.