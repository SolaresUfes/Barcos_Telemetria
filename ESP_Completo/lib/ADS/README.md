# Módulo ADS (Leitura de Sensores)

Este módulo é responsável por fazer a leitura analógica do nosso sistema. Como o ESP32 tem limitações de precisão em suas portas analógicas, usamos o módulo externo **ADS1115** para garantir leituras exatas.

## O que esse código faz?
* **Comunicação I2C:** Ele se conecta ao ESP32 usando apenas dois pinos (SDA: 21 e SCL: 22).
* **Coleta de Sensores de Efeito Hall:** Ele foi configurado para ler portas diferenciais, tirando a média de várias leituras seguidas para entregar um valor limpo e estável. Isso foi feito para nao precisarmos lidar com a grande quantidade de incertezas que lixos de memória, ou leituras brevemente erradas poderiam entregar.
* **Conversão Automática:** O próprio código já pega o valor "cru" (bits) lido pelo sensor e converte para Tensão (Volts), facilitando o uso dessa informação no resto do projeto. 

