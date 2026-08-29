# Módulo BMS (Gerenciamento de Bateria)

Este código gerencia a comunicação direta com o BMS (Battery Management System). Ele não apenas lê valores, mas "conversa" com a bateria para saber exatamente como ela está.

## O que esse código faz?
* **Comunicação RS485:** Usa o protocolo serial (junto com um pino de controle de fluxo) para enviar perguntas ao BMS e ouvir as respostas sem interferências.
* **Monitoramento de Saúde:** Ele extrai os dados cruciais de funcionamento contínuo:
  * Tensão total
  * Corrente passando no momento
  * Porcentagem de carga restante
  * Carga em células individuais
  * Temperaturas variadas
* **Central de Alertas:** Além dos dados normais, ele verifica dezenas de possíveis problemas em tempo real (como células com sobretensão, superaquecimento, curto-circuito, etc.). Se algo der errado, este módulo saberá identificar o que foi.