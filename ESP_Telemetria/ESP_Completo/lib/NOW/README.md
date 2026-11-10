# Comunicação ESP-NOW

O módulo responde aos pedidos enviados pelo display com a leitura mais recente
de porcentagem e corrente recebida do BMS.

O botão esquerdo do display também pode enviar um comando de reinício remoto.
O comando é validado e a ESP reinicia assim que uma das três cópias chega; não
é necessário receber uma confirmação de volta.

Como Wi-Fi e ESP-NOW compartilham o mesmo rádio, o display e o roteador devem
operar no mesmo canal de 2,4 GHz.
