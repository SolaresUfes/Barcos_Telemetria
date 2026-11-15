#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <vector>
#include <array>
using esp_err_t=int;
constexpr int ESP_OK=0, ESP_ERR_INVALID_ARG=1, WIFI_STA=1, WIFI_IF_STA=1, WIFI_SECOND_CHAN_NONE=0;
using wifi_second_chan_t=int;
using portMUX_TYPE=int;
#define portMUX_INITIALIZER_UNLOCKED 0
#define portENTER_CRITICAL(x) ((void)(x))
#define portEXIT_CRITICAL(x) ((void)(x))
struct SerialFake { void println(const char*) {} template<class...T> void printf(const char*,T...) {} };
static SerialFake Serial;
struct WiFiFake { bool mode(int){return true;} bool disconnect(bool,bool){return true;} };
static WiFiFake WiFi;
inline void delay(int) {}
inline const char* esp_err_to_name(int){return "mock";}
struct wifi_country_t {uint8_t schan=1,nchan=13;};
struct esp_now_peer_info_t {uint8_t peer_addr[6]={};uint8_t channel=0;int ifidx=0;bool encrypt=false;};
struct rx_ctrl_fake {uint8_t channel;};
struct esp_now_recv_info_t {const uint8_t*src_addr;rx_ctrl_fake*rx_ctrl;};
static int64_t tempo=100;
inline int64_t esp_timer_get_time(){return tempo;}
static uint8_t real_channel=3;
static bool fail_channel=false;
inline int esp_wifi_set_channel(uint8_t c,int){if(fail_channel)return 1;real_channel=c;return 0;}
inline int esp_wifi_get_channel(uint8_t*c,int*s){*c=real_channel;*s=0;return 0;}
inline int esp_wifi_get_country(wifi_country_t*c){*c=wifi_country_t{};return 0;}
inline int esp_now_init(){return 0;}
inline int esp_now_deinit(){return 0;}
inline int esp_now_register_recv_cb(void(*)(const esp_now_recv_info_t*,const uint8_t*,int)){return 0;}
static std::vector<std::array<uint8_t,6>> peers;
inline bool esp_now_is_peer_exist(const uint8_t*m){for(auto&p:peers)if(!memcmp(p.data(),m,6))return true;return false;}
inline int esp_now_add_peer(const esp_now_peer_info_t*p){std::array<uint8_t,6>a;memcpy(a.data(),p->peer_addr,6);peers.push_back(a);return 0;}
inline int esp_now_send(const uint8_t*,const uint8_t*,size_t){return 0;}
