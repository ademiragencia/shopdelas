"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { tile } from "./image";

const StoreContext = createContext(null);
const LOCAL_KEY = "viste:local:v1";

// ---------- Normalizadores (DB -> formato da UI) ----------
function normStore(r) {
  return {
    id: r.id,
    ownerId: r.owner_id,
    nome: r.nome,
    emoji: r.emoji,
    categoria: r.categoria,
    rating: Number(r.rating || 5),
    avaliacoes: r.avaliacoes || 0,
    tempo: r.tempo,
    frete: Number(r.frete || 0),
    cupom: r.cupom,
    selo: r.selo,
    pixKey: r.pix_key,
    pixTipo: r.pix_tipo,
    coord: r.coord || { x: 50, y: 40 },
  };
}
function normProduct(r) {
  return {
    id: r.id,
    storeId: r.store_id,
    nome: r.nome,
    emoji: r.emoji,
    categoria: r.categoria,
    preco: Number(r.preco),
    precoAntigo: r.preco_antigo != null ? Number(r.preco_antigo) : null,
    tamanhos: r.tamanhos || ["Único"],
    cores: r.cores || [],
    descricao: r.descricao || r.nome,
    vendidos: r.vendidos || 0,
    parcelas: 3,
    imagem: tile(r.id, r.emoji || "👕", { label: r.nome }),
  };
}
function normOrder(r) {
  const itens = (r.order_items || []).map((i) => ({
    key: i.id,
    productId: i.product_id,
    storeId: i.store_id,
    nome: i.nome,
    emoji: i.emoji,
    preco: Number(i.preco),
    tamanho: i.tamanho,
    cor: i.cor,
    qtd: i.qtd,
    imagem: tile(i.product_id || i.nome, i.emoji || "👕", { label: i.nome }),
  }));
  return {
    id: r.id,
    codigo: r.codigo,
    statusIndex: r.status_index ?? 0,
    subtotal: Number(r.subtotal || 0),
    frete: Number(r.frete || 0),
    total: Number(r.total || 0),
    endereco: r.endereco,
    pagamento: r.pagamento,
    storeCoord: r.store_coord,
    homeCoord: r.home_coord,
    criadoEm: r.created_at,
    rider: r.rider ? { id: r.rider_id, ...r.rider } : null,
    itens,
  };
}

const ORDER_SELECT =
  "*, rider:profiles!orders_rider_id_fkey(nome,veiculo,placa,rating,emoji), order_items(*)";

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Local (carrinho/favoritos/endereço)
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [address, setAddressState] = useState(null);
  const localReady = useRef(false);

  // ---- carregar/salvar local ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setCart(p.cart || []);
        setFavorites(p.favorites || []);
        setAddressState(p.address || null);
      }
    } catch {}
    localReady.current = true;
  }, []);
  useEffect(() => {
    if (!localReady.current) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ cart, favorites, address }));
    } catch {}
  }, [cart, favorites, address]);

  // ---- loaders ----
  const loadCatalog = useCallback(async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("stores").select("*").order("created_at", { ascending: true }),
      supabase.from("products").select("*").eq("ativo", true).order("created_at", { ascending: false }),
    ]);
    if (s) setStores(s.map(normStore));
    if (p) setProducts(p.map(normProduct));
  }, []);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) return setProfile(null);
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data || null);
  }, []);

  const loadOrders = useCallback(async (userId) => {
    if (!userId) return setOrders([]);
    const { data } = await supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });
    setOrders((data || []).map(normOrder));
  }, []);

  // ---- init + auth listener ----
  useEffect(() => {
    let sub;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      await Promise.all([loadCatalog(), loadProfile(uid), loadOrders(uid)]);
      setReady(true);
      sub = supabase.auth.onAuthStateChange(async (_e, sess) => {
        const id = sess?.user?.id;
        await Promise.all([loadProfile(id), loadOrders(id)]);
      }).data.subscription;
    })();
    return () => sub?.unsubscribe();
  }, [loadCatalog, loadProfile, loadOrders]);

  // ---- realtime ----
  useEffect(() => {
    if (!ready) return;
    const ch = supabase
      .channel("viste-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        loadOrders(profile?.id)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, () => loadCatalog())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [ready, profile?.id, loadOrders, loadCatalog]);

  // ---- carrinho ----
  const addToCart = (product, tamanho, cor, qtd = 1) => {
    const key = `${product.id}|${tamanho}|${cor}`;
    setCart((c) => {
      const ex = c.find((i) => i.key === key);
      if (ex) return c.map((i) => (i.key === key ? { ...i, qtd: i.qtd + qtd } : i));
      return [
        ...c,
        { key, productId: product.id, nome: product.nome, emoji: product.emoji, preco: product.preco, imagem: product.imagem, storeId: product.storeId, tamanho, cor, qtd },
      ];
    });
  };
  const setQtd = (key, qtd) =>
    setCart((c) => c.map((i) => (i.key === key ? { ...i, qtd } : i)).filter((i) => i.qtd > 0));
  const removeFromCart = (key) => setCart((c) => c.filter((i) => i.key !== key));
  const clearCart = () => setCart([]);

  const toggleFavorite = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // ---- catálogo helpers ----
  const getStore = (id) => stores.find((s) => s.id === id);
  const getProduct = (id) => products.find((p) => p.id === id);
  const productsByStore = (id) => products.filter((p) => p.storeId === id);

  const subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
  const count = cart.reduce((s, i) => s + i.qtd, 0);
  const frete = subtotal >= 99 || subtotal === 0 ? 0 : 9.9;

  const currentUser = profile;
  const myStore = profile?.id ? stores.find((s) => s.ownerId === profile.id) : null;

  // ---- auth ----
  const register = async (d) => {
    const { data, error } = await supabase.auth.signUp({
      email: d.email,
      password: d.senha,
      options: {
        data: {
          tipo: d.tipo,
          nome: d.nome,
          veiculo: d.veiculo || null,
          placa: d.placa || null,
          online: d.tipo === "entregador",
          emoji: "🛵",
        },
      },
    });
    if (error) return { ok: false, erro: traduzErro(error.message) };

    // garante sessão (se confirmação de e-mail estiver desativada)
    let uid = data.user?.id;
    if (!data.session) {
      const { data: s2, error: e2 } = await supabase.auth.signInWithPassword({
        email: d.email,
        password: d.senha,
      });
      if (e2) return { ok: true, precisaConfirmar: true };
      uid = s2.user?.id;
    }

    if (d.tipo === "lojista" && uid) {
      await supabase.from("stores").insert({
        owner_id: uid,
        nome: d.storeNome || d.nome,
        emoji: d.emoji || "🏬",
        categoria: d.categoria || "feminino",
        pix_key: d.pixKey || d.email,
        pix_tipo: d.pixTipo || "E-mail",
        coord: { x: Math.round(20 + Math.random() * 60), y: Math.round(20 + Math.random() * 40) },
      });
    }
    await Promise.all([loadCatalog(), loadProfile(uid), loadOrders(uid)]);
    return { ok: true };
  };

  const login = async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { ok: false, erro: traduzErro(error.message) };
    await Promise.all([loadProfile(data.user.id), loadOrders(data.user.id)]);
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    return { ok: true, user: prof };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setOrders([]);
  };

  // ---- lojista ----
  const addProduct = async (d) => {
    const { error } = await supabase.from("products").insert({
      store_id: d.storeId,
      nome: d.nome,
      emoji: d.emoji || "👕",
      categoria: d.categoria,
      preco: Number(d.preco),
      preco_antigo: d.precoAntigo ? Number(d.precoAntigo) : null,
      tamanhos: d.tamanhos?.length ? d.tamanhos : ["Único"],
      cores: d.cores || [],
      descricao: d.descricao || d.nome,
    });
    await loadCatalog();
    return { ok: !error, erro: error?.message };
  };
  const updateProduct = async (id, d) => {
    await supabase.from("products").update({
      nome: d.nome,
      emoji: d.emoji,
      categoria: d.categoria,
      preco: Number(d.preco),
      preco_antigo: d.precoAntigo ? Number(d.precoAntigo) : null,
      tamanhos: d.tamanhos?.length ? d.tamanhos : ["Único"],
      descricao: d.descricao,
    }).eq("id", id);
    await loadCatalog();
  };
  const deleteProduct = async (id) => {
    await supabase.from("products").delete().eq("id", id);
    await loadCatalog();
  };
  const updateStore = async (id, d) => {
    await supabase.from("stores").update(d).eq("id", id);
    await loadCatalog();
  };

  // ---- entregador ----
  const setRiderOnline = async (online) => {
    if (!profile) return;
    setProfile((p) => ({ ...p, online }));
    await supabase.from("profiles").update({ online }).eq("id", profile.id);
  };
  const ordersForRider = (riderId) => orders.filter((o) => o.rider?.id === riderId);
  const advanceOrder = async (id) => {
    await supabase.rpc("advance_order", { p_order_id: id });
    await loadOrders(profile?.id);
  };

  const ordersForStore = (storeId) => orders.filter((o) => o.itens.some((i) => i.storeId === storeId));

  // ---- pedido ----
  const placeOrder = async (base) => {
    const storeCoord = getStore(cart[0]?.storeId)?.coord || { x: 30, y: 30 };
    const { data, error } = await supabase.rpc("place_order", {
      p_items: cart.map((i) => ({
        productId: i.productId, storeId: i.storeId, nome: i.nome, emoji: i.emoji,
        preco: i.preco, tamanho: i.tamanho, cor: i.cor, qtd: i.qtd,
      })),
      p_subtotal: base.subtotal,
      p_frete: base.frete,
      p_total: base.total,
      p_endereco: base.endereco,
      p_pagamento: base.pagamento,
      p_store_coord: storeCoord,
    });
    if (error) return { ok: false, erro: traduzErro(error.message) };
    clearCart();
    await loadOrders(profile?.id);
    return { ok: true, codigo: data.codigo, id: data.id };
  };
  const getOrder = (x) => orders.find((o) => o.id === x || o.codigo === x);

  const setAddress = (a) => setAddressState(a);

  const api = useMemo(
    () => ({
      ready,
      state: { cart, favorites, orders, address },
      stores, products, getStore, getProduct, productsByStore,
      subtotal, count, frete, total: subtotal + frete,
      addToCart, setQtd, removeFromCart, clearCart,
      toggleFavorite, isFavorite: (id) => favorites.includes(id),
      setAddress,
      currentUser, myStore,
      register, login, logout,
      addProduct, updateProduct, deleteProduct, updateStore,
      setRiderOnline, ordersForRider, advanceOrder, ordersForStore,
      placeOrder, getOrder,
    }),
    [ready, cart, favorites, orders, address, stores, products, profile]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

function traduzErro(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been")) return "E-mail já cadastrado";
  if (m.includes("invalid login")) return "E-mail ou senha inválidos";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail para entrar";
  if (m.includes("password")) return "Senha muito curta (mín. 6 caracteres)";
  return msg || "Algo deu errado";
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}

export const ORDER_STEPS = [
  { label: "Pedido confirmado", emoji: "✅", desc: "A loja recebeu seu pedido" },
  { label: "Preparando", emoji: "📦", desc: "Separando e embalando suas peças" },
  { label: "A caminho", emoji: "🛵", desc: "O entregador retirou seu pedido" },
  { label: "Perto de você", emoji: "📍", desc: "O entregador está chegando" },
  { label: "Entregue", emoji: "🎉", desc: "Pedido entregue. Aproveite!" },
];

export const STEP_PROGRESS = [0, 0.12, 0.5, 0.85, 1];
