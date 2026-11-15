#include <cassert>
#include "../espnow.cpp"
uint8_t obter_canal_espnow(){return 3;}
static_assert(sizeof(PacotePedidoTelemetriaEspNow)==12, "Pedido no protocolo");
static_assert(sizeof(PacoteTelemetriaEspNow)==16, "Telemetria no protocolo");
static_assert(sizeof(PacoteReinicioRemotoEspNow)==16, "Reinicio no protocolo");
int main(){
 assert(iniciar_espnow());
 uint8_t mac[6]={1,2,3,4,5,6};
 esp_now_recv_info_t info{mac,nullptr};
 PacoteTelemetriaEspNow pkt{};
 pkt.versao=1;pkt.tamanho=sizeof(pkt);pkt.bateria_barco_percentual=-2;pkt.corrente_amperes=-2;
 TelemetriaBarco t;
 tempo=200;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 assert(obter_nova_telemetria(t)); // heartbeat sem metadado aceito
 assert(t.bateria_percentual==-2 && t.instante_recebimento_us==200);
 rx_ctrl_fake rx{0};info.rx_ctrl=&rx;
 tempo=300;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 assert(obter_nova_telemetria(t)); // metadado não determina validade
 pkt.bateria_barco_percentual=101;
 receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));assert(!obter_nova_telemetria(t));
 pkt.bateria_barco_percentual=-2;
 tempo=400;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 fail_channel=true;assert(!procurar_proximo_canal_espnow());
 assert(canal_atual_espnow==3 && obter_nova_telemetria(t)); // falha mantém canal/pacote
 tempo=500;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 fail_channel=false;tempo=600;assert(procurar_proximo_canal_espnow());
 assert(canal_atual_espnow==4 && !obter_nova_telemetria(t)); // troca descarta pendente velho
 trocando_canal=true;tempo=700;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 trocando_canal=false;assert(!obter_nova_telemetria(t));
 tempo=800;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 assert(obter_nova_telemetria(t) && canal_atual_espnow==4);
 real_channel=5;tempo=900;receber_pacote(&info,(uint8_t*)&pkt,sizeof(pkt));
 assert(obter_nova_telemetria(t) && canal_atual_espnow==5); // confirma canal real
}
