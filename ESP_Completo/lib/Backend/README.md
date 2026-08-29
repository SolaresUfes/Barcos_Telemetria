# Módulo Backend (Comunicação)

Este módulo isola toda a dor de cabeça de conectar o ESP32 à internet e enviar dados. Ele nos dá acesso aos testes usando nosso backend e internet, no geral.

## O que esse código faz?
* **Conexão Wi-Fi:** Ele conecta o ESP32 à uma rede previamente inserida automaticamente ao iniciar.
* **Empacotamento de Dados (JSON):** Ele pega as informações soltas (como tensão e corrente) e organiza em um formato estruturado chamado JSON (um formato universal que qualquer servidor entende).
* **Envio (HTTP POST):** Ele pega esse pacote JSON e "joga" para a rota do nosso servidor local, aguardando a resposta para garantir que a entrega foi bem-sucedida.

*Nota: As credenciais do Wi-Fi e o endereço IP do servidor ficam definidos no início deste arquivo. Se o local de testes mudar, é aqui que as alterações devem ser feitas.*