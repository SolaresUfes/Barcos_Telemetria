#include "../busca_canal.h"
#include <cassert>
int main()
{
  BuscaCanal b;
  assert(!b.preparar_consulta(0));
  for (int i=0; i<3; ++i) b.consulta_sem_resposta();
  assert(b.preparar_consulta(3000000));
  assert(b.preparar_consulta(4000000)); // Falha da API mantém a troca pendente.
  b.mudou_canal();
  assert(!b.preparar_consulta(4000000));
  assert(b.recebeu(4100000, 4100000));
  assert(!b.buscando);
  assert(!b.preparar_consulta(4100000+59000000));
  assert(!b.preparar_consulta(4100000+59999999));
  assert(b.preparar_consulta(4100000+60000000));
  assert(!b.recebeu(4100000,64100000));
  assert(!b.recebeu(4200000,64200000)); // Pendente antiga não encerra a busca.
  assert(b.buscando);
  b.mudou_canal();
  for (int canal=0; canal<30; ++canal) {
    for (int consulta=0; consulta<3; ++consulta) b.consulta_sem_resposta();
    assert(b.preparar_consulta(65000000+canal*3000000LL));
    b.mudou_canal();
  }
  assert(b.recebeu(160000000,160100000));
  assert(!b.buscando && b.consultas_no_canal==0);
  assert(!b.preparar_consulta(219000000));
  assert(b.preparar_consulta(220000000));
  assert(b.recebeu(221000000,221000000));
  assert(b.recebeu(280000000,280000000));
  assert(!b.preparar_consulta(281000000));
  assert(b.preparar_consulta(340000000));
  const int64_t longo=(int64_t(1)<<32)*1000;
  assert(b.recebeu(longo,longo));
  assert(!b.preparar_consulta(longo+59999999));
  assert(b.preparar_consulta(longo+60000000));
  uint8_t proximo=99;
  assert(proximo_canal_permitido(3,1,13,proximo) && proximo==4);
  assert(proximo_canal_permitido(13,1,13,proximo) && proximo==1);
  assert(proximo_canal_permitido(11,1,11,proximo) && proximo==1);
  assert(proximo_canal_permitido(1,3,5,proximo) && proximo==3);
  proximo=99;
  assert(!proximo_canal_permitido(3,1,0,proximo) && proximo==99);
  assert(!proximo_canal_permitido(3,0,13,proximo) && proximo==99);
  assert(!proximo_canal_permitido(3,1,14,proximo) && proximo==99);
}
