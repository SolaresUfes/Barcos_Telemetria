-- =====================================================================
--  Cola o link do datasheet em cada componente (pelo nome)
--
--  Como funciona: compara o nome do inventário com o nome da lista
--  ignorando maiúsculas, acentos, espaços e símbolos
--  (ex: "Tran BC547" = "tran-bc547").
--  O resultado mostra quantos foram atualizados e, abaixo, os nomes da lista
--  que NÃO existem no inventário com esse nome (se não aparecer nenhum, todos casaram).
-- =====================================================================

create or replace function pg_temp.norm(t text) returns text language sql immutable as $$
  select regexp_replace(
    lower(translate(lower(t), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]', '', 'g')
$$;

with lista(nome, url) as (
  values
  ('Acelerômetro MMA7455', 'https://www.alldatasheet.com/view.jsp?Searchword=Mma7455%20datasheet'),
  ('ADS 1115', 'https://www.alldatasheet.com/view.jsp?Searchword=Ads1115%20datasheet'),
  ('ADS 7830', 'https://www.alldatasheet.com/view.jsp?Searchword=Ads7830%20datasheet'),
  ('AM27C256-55DC', 'https://www.alldatasheet.com/view.jsp?Searchword=Am27c256%20datasheet'),
  ('AMP OP MCP6143', 'https://www.alldatasheet.com/view.jsp?Searchword=Mcp604%20datasheet'),
  ('Arduino UNO', 'https://www.alldatasheet.com/view.jsp?Searchword=Arduino%20uno%20specifications'),
  ('CD 4029 BE', 'https://www.alldatasheet.com/view.jsp?Searchword=Cd4029be%20datasheet'),
  ('CT 4N25', 'https://www.alldatasheet.com/view.jsp?Searchword=4n25'),
  ('1N4148', 'https://www.alldatasheet.com/view.jsp?Searchword=1n4148'),
  ('Diodo AC DB3', 'https://www.alldatasheet.com/view.jsp?Searchword=Db3%20datasheet'),
  ('Diodo IN4007-DC', 'https://www.alldatasheet.com/view.jsp?Searchword=1n4007'),
  ('ESP TTGO Lora', 'https://github.com/LilyGO/TTGO-LORA32/tree/master/OLED_LoRa_Sender'),
  ('ESP32', 'https://www.alldatasheet.com/view.jsp?Searchword=Esp32%20datasheet'),
  ('FFD HCF4013BE', 'https://www.alldatasheet.com/view.jsp?Searchword=Hcf4013'),
  ('FFJK CD40 27BE', 'https://www.alldatasheet.com/view.jsp?Searchword=Cd4027be'),
  ('ICM 27C256-16', 'https://www.alldatasheet.com/view.jsp?Searchword=27c256'),
  ('Módulo BT HC-06 (slave)', 'https://www.alldatasheet.com/view.jsp?Searchword=Hc-06%20datasheet'),
  ('Monitorador INA3221', 'https://www.alldatasheet.com/view.jsp?Searchword=Ina3221%20datasheet'),
  ('MOSFET IR4427', 'https://www.alldatasheet.com/view.jsp?Searchword=Ir4427'),
  ('MUX/DEMUX HCF4053BE', 'https://www.alldatasheet.com/view.jsp?Searchword=HCF4053BE&sField=2'),
  ('OR HEF4071BP', 'https://www.alldatasheet.com/view.jsp?Searchword=Hef4071bp'),
  ('PIC 12C 509A', 'https://www.alldatasheet.com/view.jsp?Searchword=Pic12c509a'),
  ('PIC 16F-877A I/P', 'https://www.alldatasheet.com/view.jsp?Searchword=Pic16f877'),
  ('PIC 16F6 28A', 'https://www.alldatasheet.com/view.jsp?Searchword=Pic16f628a%20datasheet'),
  ('PS 2501-4', 'https://www.alldatasheet.com/view.jsp?Searchword=Ps2501-4%20datasheet'),
  ('Sensor Corrente ACS712', 'https://www.alldatasheet.com/view.jsp?Searchword=Acs712%20datasheet'),
  ('TMS JL 27C512 10', 'https://www.alldatasheet.com/view.jsp?Searchword=27c512'),
  ('TMS JL 27C512 12', 'https://www.alldatasheet.com/view.jsp?Searchword=27c512'),
  ('Tran BC547', 'https://www.alldatasheet.com/view.jsp?Searchword=Bc547%20pdf'),
  ('Tran BC559B', 'https://www.alldatasheet.com/view.jsp?Searchword=Bc559b')
),
atualizados as (
  update public.componentes c
     set datasheet_url = l.url
    from lista l
   where pg_temp.norm(c.nome) = pg_temp.norm(l.nome)
  returning l.nome
)
select 0 as ordem, 'ATUALIZADOS: ' || (select count(distinct nome) from atualizados) || ' de 30' as resultado
union all
select 1, 'NÃO ENCONTRADO: ' || l.nome
  from lista l
 where l.nome not in (select nome from atualizados)
 order by 1, 2;
