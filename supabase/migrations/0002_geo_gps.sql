-- Mapa/GPS real: coordenadas de lat/lng nas lojas e pedidos + funções

-- Colunas geográficas
alter table public.stores add column if not exists lat double precision;
alter table public.stores add column if not exists lng double precision;

alter table public.orders add column if not exists store_lat double precision;
alter table public.orders add column if not exists store_lng double precision;
alter table public.orders add column if not exists home_lat double precision;
alter table public.orders add column if not exists home_lng double precision;
alter table public.orders add column if not exists rider_lat double precision;
alter table public.orders add column if not exists rider_lng double precision;

alter table public.profiles add column if not exists lat double precision;
alter table public.profiles add column if not exists lng double precision;

-- Localização de exemplo para as lojas demo (Campo Grande - MS)
update public.stores set lat = -20.4640, lng = -54.6100 where nome = 'Urban Style' and lat is null;
update public.stores set lat = -20.4550, lng = -54.6300 where nome = 'Bella Moda' and lat is null;
update public.stores set lat = -20.4820, lng = -54.6050 where nome = 'Mundo Kids' and lat is null;
update public.stores set lat = -20.4700, lng = -54.6400 where nome = 'SneakerBox' and lat is null;
update public.stores set lat = -20.4600, lng = -54.6200 where nome = 'FitPro Sports' and lat is null;
update public.stores set lat = -20.4750, lng = -54.6250 where nome = 'Charme Acessórios' and lat is null;

-- place_order agora recebe lat/lng da loja e do cliente
drop function if exists public.place_order(jsonb, numeric, numeric, numeric, jsonb, jsonb, jsonb);
create or replace function public.place_order(
  p_items jsonb,
  p_subtotal numeric,
  p_frete numeric,
  p_total numeric,
  p_endereco jsonb,
  p_pagamento jsonb,
  p_store_coord jsonb,
  p_store_lat double precision default null,
  p_store_lng double precision default null,
  p_home_lat double precision default null,
  p_home_lng double precision default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_rider uuid;
  v_order public.orders;
  v_item jsonb;
  v_codigo text;
begin
  if auth.uid() is null then raise exception 'Precisa estar logado'; end if;

  select id into v_rider from public.profiles
   where tipo = 'entregador' and online = true
   order by random() limit 1;

  v_codigo := 'V' || to_char(now(),'HH24MISS') || floor(random()*90+10)::text;

  insert into public.orders (
    codigo, cliente_id, rider_id, status_index, subtotal, frete, total,
    endereco, pagamento, store_coord,
    store_lat, store_lng, home_lat, home_lng, rider_lat, rider_lng
  )
  values (
    v_codigo, auth.uid(), v_rider, 0, p_subtotal, p_frete, p_total,
    p_endereco, p_pagamento, p_store_coord,
    p_store_lat, p_store_lng, p_home_lat, p_home_lng, p_store_lat, p_store_lng
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (order_id, product_id, store_id, nome, emoji, preco, tamanho, cor, qtd)
    values (
      v_order.id,
      nullif(v_item->>'productId','')::uuid,
      nullif(v_item->>'storeId','')::uuid,
      v_item->>'nome',
      v_item->>'emoji',
      (v_item->>'preco')::numeric,
      v_item->>'tamanho',
      v_item->>'cor',
      (v_item->>'qtd')::int
    );
  end loop;

  return v_order;
end $$;

-- Atualiza a localização do entregador (somente o da corrida)
create or replace function public.update_rider_location(
  p_order_id uuid,
  p_lat double precision,
  p_lng double precision
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders
     set rider_lat = p_lat, rider_lng = p_lng
   where id = p_order_id and rider_id = auth.uid();
  update public.profiles set lat = p_lat, lng = p_lng where id = auth.uid();
end $$;
